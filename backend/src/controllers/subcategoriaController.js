const { Subcategoria, Categoria } = require('../models');
/**
 * @description Busca todas as subcategorias que pertencem a uma categoria específica.
 * @param {string} req.params.categoriaId - O ID da categoria pai.
 */
exports.pegarSubcategoriasPorCategoria = async (req, res) => {
    try {
        const { categoriaId } = req.params;
        const subcategorias = await Subcategoria.findAll({
            where: {
                categoria_id: categoriaId
            }
        });
        res.status(200).json(subcategorias);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar subcategorias por categoria.", error: error.message });
    }
};


//listar todas as subcategorias conectando à sua categoria 
exports.pegarTodasSubcategorias = async (req, res) => {
    try {
        const subcategorias = await Subcategoria.findAll({
            include: [{
                model: Categoria,
                as: 'categoria', // Alias definido na associação
                attributes: ['nome'] // Pega apenas o nome da categoria
            }]
        });
        res.status(200).json(subcategorias);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar subcategorias", error: error.message });
    }
};


exports.pegarSubcategoriaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const subcategoria = await Subcategoria.findByPk(id, {
            include: [{ model: Categoria, as: 'categoria', attributes: ['nome'] }]
        });

        if (subcategoria) {
            res.status(200).json(subcategoria);
        } else {
            res.status(404).json({ message: "Subcategoria não encontrada." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar subcategoria", error: error.message });
    }
};

//criar categoria associando à sua categoria
exports.criarSubcategoria = async (req, res) => {
    try {
        const { nome, descricao, categoria_id } = req.body;
        
        
        if (!validarCampos(nome, descricao, categoria_id)) {
            return res.status(400).json({ message: "Os campos nome, descrição e categoria_id são obrigatórios." });
        }

        
        const categoriaPai = await Categoria.findByPk(categoria_id);
        if (!categoriaPai) {
            return res.status(404).json({ message: "Categoria pai não encontrada." });
        }

        const novaSubcategoria = await Subcategoria.create({ nome, descricao, categoria_id });
        res.status(201).json(novaSubcategoria);

    } catch (error) {
        res.status(500).json({ message: "Erro ao criar subcategoria.", error: error.message });
    }
};


exports.atualizarSubcategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, categoria_id } = req.body;

        const [updated] = await Subcategoria.update({ nome, descricao, categoria_id }, {
            where: { id: id }
        });

        if (updated) {
            const subcategoriaAtualizada = await Subcategoria.findByPk(id);
            res.status(200).json(subcategoriaAtualizada);
        } else {
            res.status(404).json({ message: "Subcategoria não encontrada." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar subcategoria.", error: error.message });
    }
};


exports.deletarSubcategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Subcategoria.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: "Subcategoria não encontrada." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar subcategoria.", error: error.message });
    }
};

function validarCampos(nome, descricao, categoria_id){
    let camposValidados = true;

    if(!nome || !descricao || !categoria_id){
        camposValidados = false;
    }


    return camposValidados;
}
