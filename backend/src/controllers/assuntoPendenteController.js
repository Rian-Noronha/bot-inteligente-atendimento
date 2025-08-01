const { AssuntoPendente, ChatConsulta, Subcategoria, Categoria } = require('../models'); // Importe o model Categoria também
const { validarCamposObrigatorios } = require('../utils/validation');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');
const {Op} = require('sequelize');

/**
 * Busca todos os assuntos pendentes de forma PAGINADA.
 * duas consultas para garantir performance e precisão.
 */
exports.pegarAssuntosPendentesPaginado = async (req, res) => {
    const { page, limit, offset, search } = getPaginationParams(req.query);

    let whereClause = {};
    const includeClause = [
        {
            model: Subcategoria,
            as: 'subcategoria',
            attributes: [],
            include: [{ model: Categoria, as: 'categoria', attributes: [] }]
        }
    ];

    if (search) {
        const searchTerm = `%${search}%`;
        whereClause = {
            [Op.or]: [
                { texto_assunto: { [Op.iLike]: searchTerm } },
                { '$subcategoria.nome$': { [Op.iLike]: searchTerm } },
                { '$subcategoria.categoria.nome$': { [Op.iLike]: searchTerm } }
            ]
        };
    }

    // apenas os IDs dos assuntos que correspondem ao filtro.
    const matchingAssuntos = await AssuntoPendente.findAll({
        where: whereClause,
        include: includeClause,
        attributes: ['id'],
        group: ['AssuntoPendente.id'], // Agrupa para garantir IDs únicos
        raw: true,
    });

    const totalItems = matchingAssuntos.length;
    const assuntoIds = matchingAssuntos.map(assunto => assunto.id);

    // dados completos apenas para os IDs da página atual.
    const rows = await AssuntoPendente.findAll({
        where: { id: { [Op.in]: assuntoIds } },
        limit: limit,
        offset: offset,
        include: [
            {
                model: Subcategoria,
                as: 'subcategoria',
                include: [{ model: Categoria, as: 'categoria' }]
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    // construir a resposta final padronizada.
    const response = buildPaginationResponse(rows, totalItems, page, limit);
    res.status(200).json(response);
};

/**
 * assuntos pendentes, sem paginação.
 */
exports.pegarTodosAssuntosPendentes = async (req, res) => {
    const assuntos = await AssuntoPendente.findAll({
        include: [
            { model: Subcategoria, as: 'subcategoria', include: [{ model: Categoria, as: 'categoria' }] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.status(200).json(assuntos);
};


exports.criarAssuntoPendente = async (req, res) => {
    const { consulta_id, texto_assunto, subcategoria_id } = req.body;
    if (!validarCamposObrigatorios([consulta_id, texto_assunto, subcategoria_id])) {
        return res.status(400).json({ message: 'Os campos "consulta_id", "texto_assunto" e "subcategoria_id" são obrigatórios.' });
    }

    const consulta = await ChatConsulta.findByPk(consulta_id);
    if (!consulta) {
        return res.status(404).json({ message: 'Consulta associada não encontrada.' });
    }

    const subcategoria = await Subcategoria.findByPk(subcategoria_id);
    if (!subcategoria) {
        return res.status(404).json({ message: 'Subcategoria associada não encontrada.' });
    }

    const novoAssunto = await AssuntoPendente.create({
        consulta_id,
        texto_assunto,
        subcategoria_id,
        datahora_sugestao: new Date()
    });

    res.status(201).json(novoAssunto);
};


exports.atualizarStatusAssunto = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'O campo "status" é obrigatório.' });
    }

    const [updated] = await AssuntoPendente.update({ status }, {
        where: { id: id }
    });

    if (updated) {
        const assuntoAtualizado = await AssuntoPendente.findByPk(id);
        res.status(200).json(assuntoAtualizado);
    } else {
        res.status(404).json({ message: 'Assunto pendente não encontrado.' });
    }
};


exports.deletarAssuntoPendente = async (req, res) => {
    const { id } = req.params;
    const deleted = await AssuntoPendente.destroy({
        where: { id: id }
    });

    if (deleted) {
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Assunto pendente não encontrado.' });
    }
};

