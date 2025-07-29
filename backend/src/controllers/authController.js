const { Usuario, Perfil, SessaoAtiva, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { enviarEmailRecuperacao } = require('../services/emailService');

/**
 * @description Realiza o login, invalida sessões antigas e cria uma nova sessão ativa.
 */
exports.login = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ message: "Email e senha são obrigatórios." });
        }

        const usuario = await Usuario.scope('withPassword').findOne({
            where: { email },
            include: [{ model: Perfil, as: 'perfil' }],
            transaction: t // garantir que a leitura faça parte da transação
        });

        if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senha_hash))) {
            await t.rollback();
            return res.status(401).json({ message: "Credenciais inválidas ou usuário inativo." });
        }

        // --- lógica de sessão única ---
        await SessaoAtiva.destroy({ where: { usuario_id: usuario.id }, transaction: t });
        const sessionId = uuidv4();
        await SessaoAtiva.create({ session_id: sessionId, usuario_id: usuario.id }, { transaction: t });
        
        // Se tudo deu certo, confirma a transação
        await t.commit();
        
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
        
        // tirar  o hash da senha do objeto antes de enviá-lo na resposta
        const { senha_hash, ...usuarioSemSenha } = usuario.toJSON();
        
        res.status(200).json({ token, usuario: payload });

    } catch (error) {
        await t.rollback();
        console.error("Erro durante o login:", error);
        res.status(500).json({ message: "Erro interno no servidor durante o login." });
    }
};

/**
 * @description Realiza o logout do usuário.
 */
exports.logout = async (req, res) => {
    try {
        const { sessionId } = req.user;
        if (sessionId) {
            await SessaoAtiva.destroy({ where: { session_id: sessionId } });
        }
        res.status(200).json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
        console.error("Erro ao realizar o logout:", error);
        res.status(500).json({ message: 'Erro ao realizar o logout.' });
    }
};

/**
 * @description Inicia o fluxo de recuperação de senha.
 */
exports.esqueciSenha = async (req, res) => {
    try {
        const { email } = req.body;
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

    } catch (error) {
        console.error("Erro no processo de 'esqueci a senha':", error);
        res.status(500).json({ message: 'Erro no servidor ao processar a solicitação.' });
    }
};

/**
 * @description Finaliza o fluxo de recuperação de senha.
 */
exports.redefinirSenha = async (req, res) => {
    try {
        const { token, senha } = req.body;
        if (!token || !senha) {
            return res.status(400).json({ message: 'O token e a nova senha são obrigatórios.' });
        }
        const usuario = await Usuario.findOne({
            where: {
                reset_password_token: token,
                reset_password_expires: { [Op.gt]: new Date() }
            }
        });
        if (!usuario) {
            return res.status(400).json({ message: 'Token de recuperação inválido ou já expirado.' });
        }
        usuario.senha_hash = senha;
        usuario.reset_password_token = null;
        usuario.reset_password_expires = null;
        await usuario.save();
        res.status(200).json({ message: 'Sua senha foi redefinida com sucesso!' });
    } catch (error) {
        console.error("Erro no processo de 'redefinir a senha':", error);
        res.status(500).json({ message: 'Erro no servidor ao redefinir a senha.' });
    }
};

/**
 * @description Retorna os dados do usuário logado.
 */
exports.getMe = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id, {
            include: [{ model: Perfil, as: 'perfil', attributes: ['nome'] }]
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        
        res.status(200).json(usuario);
        
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar dados do usuário." });
    }
};


/**
 * @description Atualiza a senha do usuário logado.
 */
exports.updatePassword = async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;

        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ message: 'A senha atual e a nova senha são obrigatórias.' });
        }

        const usuario = await Usuario.scope('withPassword').findByPk(req.user.id);

        if (!usuario || !usuario.senha_hash) {
            return res.status(500).json({ message: 'Não foi possível verificar as credenciais do usuário.' });
        }
        
        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ message: 'A senha atual está incorreta.' });
        }
        
        usuario.senha_hash = novaSenha;
        await usuario.save();

        res.status(200).json({ message: 'Senha atualizada com sucesso!' });

    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        res.status(500).json({ message: 'Erro interno ao atualizar a senha.' });
    }
};
