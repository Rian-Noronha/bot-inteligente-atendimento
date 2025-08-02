const {Categoria} = require('../models');
const {Op} = require('sequelize');
const { validarCamposObrigatorios } = require('../utils/validation');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');

/**
 * Pegando todas as categorias.
 */
exports.pegarTodasCategorias = async (req, res) => {
    const categorias = await Categoria.findAll();
    res.status(200).json(categorias);
};

/**
 * Busca categorias com paginação e filtro de busca.
 */
exports.pegarCategoriasPorPaginacao = async (req, res) => {
    const { page, limit, offset, search } = getPaginationParams(req.query);

    let whereClause = {};
    if (search) {
        whereClause = {
            nome: { [Op.iLike]: `%${search}%` }
        };
    }

    const { count, rows } = await Categoria.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['nome', 'ASC']]
    });

    const response = buildPaginationResponse(rows, count, page, limit);

    res.status(200).json(response);
};

exports.pegarCategoriaPorId = async (req, res) => {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);

    if (categoria) {
        res.status(200).json(categoria);
    } else {
        res.status(404).json({ message: 'Categoria não encontrada.' });
    }
};

exports.criarCategoria = async (req, res) => {
    const { nome, descricao } = req.body;
    if (!validarCamposObrigatorios([nome, descricao])) {
        return res.status(400).json({ message: 'Os campos nome e descrição são obrigatórios.' });
    }

    const novaCategoria = await Categoria.create({ nome, descricao });
    res.status(201).json(novaCategoria);
};


exports.atualizarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    const [atualizada] = await Categoria.update({ nome, descricao }, {
        where: { id: id }
    });

    if (atualizada) {
        const categoriaAtualizada = await Categoria.findByPk(id);
        res.status(200).json(categoriaAtualizada);
    } else {
        res.status(404).json({ message: 'Categoria não encontrada.' });
    }
};

exports.deletarCategoria = async (req, res) => {
    const { id } = req.params;
    const deletada = await Categoria.destroy({
        where: { id: id }
    });

    if (deletada) {
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Categoria não encontrada.' });
    }
};
