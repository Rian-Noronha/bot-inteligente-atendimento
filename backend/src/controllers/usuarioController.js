const { Usuario, Perfil } = require('../models');
exports.pegarTodosUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['senha_hash'] },
            include: [{
                model: Perfil,
                as: 'perfil',
                attributes: ['id', 'nome']
            }],
            order: [['nome', 'ASC']]
        });
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar usuários", error: error.message });
    }
};

exports.pegarUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['senha_hash'] },
            include: [{ model: Perfil, as: 'perfil', attributes: ['id', 'nome'] }]
        });

        if (usuario) {
            res.status(200).json(usuario);
        } else {
            res.status(404).json({ message: "Usuário não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar usuário", error: error.message });
    }
};


exports.criarUsuario = async (req, res) => {
    try {
        const { nome, email, senha, perfil_id } = req.body;
        if (!nome || !email || !senha || !perfil_id) {
            return res.status(400).json({ message: "Todos os campos (nome, email, senha, perfil_id) são obrigatórios." });
        }

        
        // 1. Passar a senha em texto plano para o campo 'senha_hash'.
        // 2. O hook 'beforeCreate' no model do Usuario irá intercetar este valor,
        //    encriptá-lo e salvá-lo corretamente na base de dados.
        const novoUsuario = await Usuario.create({
            nome,
            email,
            senha_hash: senha, // O hook tratará de encriptar este valor
            perfil_id,
            ativo: true
        });

        // Retorna o usuário criado
        const { senha_hash: _, ...usuarioSemSenha } = novoUsuario.toJSON();
        res.status(201).json(usuarioSemSenha);

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Este email já está em uso.' });
        }
        res.status(500).json({ message: "Erro ao criar usuário", error: error.message });
    }
};


/**
 * Atualiza um usuário existente usando o padrão "buscar e salvar" para garantir
 * que os hooks do Sequelize (como o de criptografar senha) sejam acionados.
 */
exports.atualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, perfil_id, ativo } = req.body;

        // 1. Busca a instância completa do usuário no banco
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 2. Atualiza apenas os campos que foram fornecidos
        // O operador '??' mantém o valor antigo se o novo for nulo ou indefinido
        usuario.nome = nome ?? usuario.nome;
        usuario.email = email ?? usuario.email;
        usuario.perfil_id = perfil_id ?? usuario.perfil_id;
        
        // Trata o campo 'ativo' separadamente para permitir 'false'
        if (ativo !== undefined) {
            usuario.ativo = ativo;
        }

        // 3. Salva a instância atualizada. É neste passo que o hook 'beforeUpdate' é executado.
        await usuario.save();
        
        // Busca novamente com o perfil para retornar os dados completos e atualizados
        const usuarioAtualizado = await Usuario.findByPk(id, {
            include: [{ model: Perfil, as: 'perfil'}]
        });

        res.status(200).json(usuarioAtualizado);

    } catch (error) {
        // Trata erros de validação, como e-mail duplicado
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Este email já está em uso por outro usuário.' });
        }
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ message: "Erro ao atualizar usuário", error: error.message });
    }
};


exports.deletarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Usuario.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: "Usuário não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar usuário", error: error.message });
    }
};
