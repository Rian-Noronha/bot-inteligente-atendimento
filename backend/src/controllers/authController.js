const { Usuario, Perfil, SessaoAtiva, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { enviarEmailRecuperacao } = require('../services/emailService');
const { validarCamposObrigatorios } = require('../utils/validation'); 
const withTransaction = require('../middlewares/transactionMiddleware');

/**
 * @description Realiza o login, invalida sessões antigas e cria uma nova sessão ativa.
 */
exports.login = withTransaction(async (req, res, t) => {
    const { email, senha } = req.body;

    if (!validarCamposObrigatorios([email, senha])) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    const usuario = await Usuario.scope('withPassword').findOne({
        where: { email },
        include: [{ model: Perfil, as: 'perfil' }],
        transaction: t
    });

    if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senha_hash))) {
        throw { status: 401, message: "Credenciais inválidas ou usuário inativo." };
    }

    
    await SessaoAtiva.destroy({ where: { usuario_id: usuario.id }, transaction: t });
    const sessionId = uuidv4();
    await SessaoAtiva.create({ session_id: sessionId, usuario_id: usuario.id }, { transaction: t });
    
    const payload = {
        id: usuario.id,
        sessionId: sessionId,
        nome: usuario.nome,
        email: usuario.email,
        perfil: {
            id: usuario.perfil.id,
            nome: usuario.perfil.nome
        }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    const { senha_hash, ...usuarioSemSenha } = usuario.toJSON();
    
    res.status(200).json({ token, usuario: payload });
});

/**
 * @description Realiza o logout do usuário.
 */
exports.logout = async (req, res) => {
    const { sessionId } = req.user;
    if (sessionId) {
        await SessaoAtiva.destroy({ where: { session_id: sessionId } });
    }
    res.status(200).json({ message: 'Logout realizado com sucesso.' });
};

/**
 * @description Inicia o fluxo de recuperação de senha.
 */
exports.esqueciSenha = async (req, res) => {
    const { email } = req.body;
   
    if (!email) {
        return res.status(400).json({ message: 'O campo "email" é obrigatório.' });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
        return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    usuario.reset_password_expires = sequelize.literal("NOW() + INTERVAL '1 hour'");
    usuario.reset_password_token = resetToken;
    await usuario.save();

    await enviarEmailRecuperacao(usuario.email, resetToken);

    res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.' });
};

/**
 * @description Finaliza o fluxo de recuperação de senha.
 */
exports.redefinirSenha = async (req, res) => {
    const { token, senha } = req.body;

    if (!validarCamposObrigatorios([token, senha])) {
        return res.status(400).json({ message: 'O token e a nova senha são obrigatórios.' });
    }

    const usuario = await Usuario.findOne({
        where: {
            reset_password_token: token,
            reset_password_expires: { [Op.gt]: new Date() }
        }
    });

    if (!usuario) {
        throw { status: 400, message: 'Token de recuperação inválido ou já expirado.' };
    }

    usuario.senha_hash = senha; // O hook 'beforeSave' no modelo Usuario deve encriptar 
    usuario.reset_password_token = null;
    usuario.reset_password_expires = null;
    await usuario.save();
    res.status(200).json({ message: 'Sua senha foi redefinida com sucesso!' });
};

/**
 * @description Retorna os dados do usuário logado.
 */
exports.getMe = async (req, res) => {
    const usuario = await Usuario.findByPk(req.user.id, {
        include: [{ model: Perfil, as: 'perfil', attributes: ['nome'] }]
    });

    if (!usuario) {
        throw { status: 404, message: 'Usuário não encontrado.' };
    }
    
    res.status(200).json(usuario);
};


/**
 * @description Atualiza a senha do usuário logado.
 */
exports.updatePassword = async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    
    if (!validarCamposObrigatorios([senhaAtual, novaSenha])) {
        return res.status(400).json({ message: 'A senha atual e a nova senha são obrigatórias.' });
    }

    const usuario = await Usuario.scope('withPassword').findByPk(req.user.id);

    if (!usuario || !usuario.senha_hash) {
        throw { status: 500, message: 'Não foi possível verificar as credenciais do usuário.' };
    }
    
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    if (!senhaValida) {
        throw { status: 401, message: 'A senha atual está incorreta.' };
    }
    
    usuario.senha_hash = novaSenha; // O hook 'beforeUpdate' no modelo Usuario deve encriptar 
    await usuario.save();

    res.status(200).json({ message: 'Senha atualizada com sucesso!' });
};
