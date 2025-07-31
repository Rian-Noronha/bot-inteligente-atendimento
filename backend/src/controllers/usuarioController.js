const { Usuario, Perfil } = require('../models');
const {Op} = require('sequelize');
const { validarCamposObrigatorios } = require("../utils/validation");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");

/**
 * Busca usuários com paginação, filtro de busca e retorna metadados.
 */
exports.pegarTodosUsuarios = async (req, res) => {
    const { page, limit, offset, search } = getPaginationParams(req.query);

    let whereClause = {};
    if (search) {
        whereClause = {
            [Op.or]: [
                { nome: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ]
        };
    }

    const { count, rows } = await Usuario.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        attributes: { exclude: ["senha_hash"] },
        include: [{
            model: Perfil,
            as: "perfil",
            attributes: ["id", "nome"]
        }],
        order: [["nome", "ASC"]],
        distinct: true
    });

    const response = buildPaginationResponse(rows, count, page, limit);
    res.status(200).json(response);
};

exports.pegarUsuarioPorId = async (req, res) => {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
        attributes: { exclude: ["senha_hash"] },
        include: [{ model: Perfil, as: "perfil", attributes: ["id", "nome"] }]
    });

    if (usuario) {
        res.status(200).json(usuario);
    } else {
        throw { status: 404, message: "Usuário não encontrado." };
    }
};

exports.criarUsuario = async (req, res) => {
    const { nome, email, senha, perfil_id } = req.body;
    if (!validarCamposObrigatorios([nome, email, senha, perfil_id])) {
        throw { status: 400, message: "Todos os campos (nome, email, senha, perfil_id) são obrigatórios." };
    }

    const novoUsuario = await Usuario.create({
        nome,
        email,
        senha_hash: senha,
        perfil_id,
        ativo: true
    });

    const { senha_hash: _, ...usuarioSemSenha } = novoUsuario.toJSON();
    res.status(201).json(usuarioSemSenha);
};

/**
 * Atualiza um usuário existente usando o padrão "buscar e salvar" para garantir
 * que os hooks do Sequelize (como o de criptografar senha) sejam acionados.
 */
exports.atualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nome, email, perfil_id, ativo } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
        throw { status: 404, message: "Usuário não encontrado." };
    }

    usuario.nome = nome ?? usuario.nome;
    usuario.email = email ?? usuario.email;
    usuario.perfil_id = perfil_id ?? usuario.perfil_id;

    if (ativo !== undefined) {
        usuario.ativo = ativo;
    }

    await usuario.save();

    const usuarioAtualizado = await Usuario.findByPk(id, {
        include: [{ model: Perfil, as: "perfil"}]
    });

    res.status(200).json(usuarioAtualizado);
};

exports.deletarUsuario = async (req, res) => {
    const { id } = req.params;
    const deleted = await Usuario.destroy({
        where: { id: id }
    });

    if (deleted) {
        res.status(204).send();
    } else {
        throw { status: 404, message: "Usuário não encontrado." };
    }
};
