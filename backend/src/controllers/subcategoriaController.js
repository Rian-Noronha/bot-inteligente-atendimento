const { Subcategoria, Categoria } = require('../models');
const { validarCamposObrigatorios } = require('../utils/validation');

/**
 * @description Busca todas as subcategorias que pertencem a uma categoria específica.
 * @param {string} req.params.categoriaId - O ID da categoria pai.
 */
exports.pegarSubcategoriasPorCategoria = async (req, res) => {
    const { categoriaId } = req.params;
    const subcategorias = await Subcategoria.findAll({
        where: {
            categoria_id: categoriaId
        }
    });
    res.status(200).json(subcategorias);
};


//listar todas as subcategorias conectando à sua categoria 
exports.pegarTodasSubcategorias = async (req, res) => {
    const subcategorias = await Subcategoria.findAll({
        include: [{
            model: Categoria,
            as: 'categoria',
            attributes: ['nome']
        }]
    });
    res.status(200).json(subcategorias);
};

exports.pegarSubcategoriaPorId = async (req, res) => {
    const { id } = req.params;
    const subcategoria = await Subcategoria.findByPk(id, {
        include: [{ model: Categoria, as: 'categoria', attributes: ['nome'] }]
    });

    if (subcategoria) {
        res.status(200).json(subcategoria);
    } else {
        throw { status: 404, message: "Subcategoria não encontrada." };
    }
};

//criar categoria associando à sua categoria
exports.criarSubcategoria = async (req, res) => {
    const { nome, descricao, categoria_id } = req.body;
    
    if (!validarCamposObrigatorios([nome, descricao, categoria_id])) {
        throw { status: 400, message: "Os campos nome, descrição e categoria_id são obrigatórios." };
    }
    
    const categoriaPai = await Categoria.findByPk(categoria_id);
    if (!categoriaPai) {
        throw { status: 404, message: "Categoria pai não encontrada." };
    }

    const novaSubcategoria = await Subcategoria.create({ nome, descricao, categoria_id });
    res.status(201).json(novaSubcategoria);
};

exports.atualizarSubcategoria = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, categoria_id } = req.body;

    if (!validarCamposObrigatorios([nome, descricao, categoria_id])) {
         throw { status: 400, message: "Os campos nome, descrição e categoria_id são obrigatórios." };
    }

    const [updated] = await Subcategoria.update({ nome, descricao, categoria_id }, {
        where: { id: id }
    });

    if (updated) {
        const subcategoriaAtualizada = await Subcategoria.findByPk(id);
        res.status(200).json(subcategoriaAtualizada);
    } else {
        throw { status: 404, message: "Subcategoria não encontrada." };
    }
};

exports.deletarSubcategoria = async (req, res) => {
    const { id } = req.params;
    const deleted = await Subcategoria.destroy({
        where: { id: id }
    });

    if (deleted) {
        res.status(204).send();
    } else {
        throw { status: 404, message: "Subcategoria não encontrada." };
    }
};

