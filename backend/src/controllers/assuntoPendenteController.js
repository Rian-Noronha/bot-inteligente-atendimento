const { AssuntoPendente, ChatConsulta, Subcategoria, Categoria } = require('../models'); // Importe o model Categoria também
const { validarCamposObrigatorios } = require('../utils/validation');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');

/**
 * Busca todos os assuntos pendentes de forma PAGINADA.
 * Ideal para a tela principal do dashboard.
 */
exports.pegarAssuntosPendentesPaginado = async (req, res) => {
    const { page, limit, offset, search } = getPaginationParams(req.query);

    let whereClause = {};
    if (search) {
        whereClause = {
            [Op.or]: [
                { texto_assunto: { [Op.iLike]: `%${search}%` } },
                { '$subcategoria.nome$': { [Op.iLike]: `%${search}%` } },
                { '$subcategoria.categoria.nome$': { [Op.iLike]: `%${search}%` } }
            ]
        };
    }

    const { count, rows } = await AssuntoPendente.findAndCountAll({
        where: whereClause,
        include: [
            { model: Subcategoria, as: 'subcategoria', required: true, include: [{ model: Categoria, as: 'categoria', required: true }] }
        ],
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        distinct: true,
        subQuery: false
    });

    const response = buildPaginationResponse(rows, count, page, limit);
    res.status(200).json(response);
};

/**
 * Busca TODOS os assuntos pendentes, sem paginação.
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

