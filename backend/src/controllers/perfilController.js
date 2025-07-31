const { Perfil } = require('../models');
const {Op} = require('sequelize');
const { validarCamposObrigatorios } = require('../utils/validation');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');

exports.pegarTodosPerfis = async (req, res) => {
    const perfis = await Perfil.findAll();
    res.status(200).json(perfis);
};

exports.pegarPerfisPorPaginacao = async (req, res) => {
    const { page, limit, offset, search } = getPaginationParams(req.query);

    let whereClause = {};
    if (search) {
        whereClause = {
            nome: { [Op.iLike]: `%${search}%` }
        };
    }

    const { count, rows } = await Perfil.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['nome', 'ASC']] 
    });

    const response = buildPaginationResponse(rows, count, page, limit);
    res.status(200).json(response);
};

exports.pegarPerfilPorId = async(req, res) => {
    const { id } = req.params;
    const perfil = await Perfil.findByPk(id);

    if (perfil) {
        res.status(200).json(perfil);
    } else {
        throw { status: 404, message: 'Perfil não encontrado.' };
    }
};

exports.criarPerfil = async (req, res) => {
    const { nome, descricao } = req.body;
    if (!validarCamposObrigatorios([nome, descricao])) {
        throw { status: 400, message: 'Os campos nome e descrição são obrigatórios.' };
    }
    
    const novoPerfil = await Perfil.create({ nome, descricao });
    res.status(201).json(novoPerfil);
};

exports.atualizarPerfil = async (req, res) => { 
    const { id } = req.params;
    const { nome, descricao } = req.body;

    if (!validarCamposObrigatorios([nome, descricao])) {
        throw { status: 400, message: 'Os campos nome e descrição são obrigatórios.' };
    }

    const [atualizado] = await Perfil.update({ nome, descricao }, {
        where: { id: id }
    });

    if (atualizado) {
        const perfilAtualizado = await Perfil.findByPk(id);
        res.status(200).json(perfilAtualizado);
    } else {
        throw { status: 404, message: 'Perfil não encontrado.' };
    }
};

exports.deletarPerfil = async (req, res) => {
    const { id } = req.params;
    const deletado = await Perfil.destroy({
        where: { id: id }
    });

    if (deletado) {
        res.status(204).send();
    } else {
        throw { status: 404, message: 'Perfil não encontrado.' };
    }
};