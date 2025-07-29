const {Categoria} = require('../models');

    exports.pegarTodasCategorias = async (req, res) => {
        try{
            const categorias = await Categoria.findAll();
            res.status(200).json(categorias);
        }catch(error){
            res.status(500).json({message: 'Erro ao buscar categorias.', error: error.message});
        }
    };

    exports.pegarCategoriaPorId = async (req, res) => {
        try{
            const {id} = req.params;
            const categoria = await Categoria.findByPk(id);

            if(categoria){
                res.status(200).json(categoria);
            }else{
                res.status(404).json({message: 'Categoria não encontrada.'});
            }
            
        }catch(error){
            res.status(500).json({message: 'Erro ao buscar categoria.', error: error.message});
        }
    };

    exports.criarCategoria = async (req, res) => {
        try{
            const {nome, descricao} = req.body;
            if(!validarCampos(nome, descricao)){
                return res.status(400).json({message: 'Os campos nome e descrição são obrigatórios.'});
            }

            const novaCategoria = await Categoria.create({nome, descricao});
            res.status(201).json(novaCategoria);
        }catch(error){
            res.status(500).json({message: 'Erro ao criar categoria.', error: error.message});
        }
    };


    exports.atualizarCategoria = async (req, res) => {
        try{
            const {id} = req.params;
            const {nome, descricao} = req.body;

            const [atualizada] = await Categoria.update({nome, descricao}, {
                where: {id: id}
            });

            if(atualizada){
                const categoriaAtualizada = await Categoria.findByPk(id);
                res.status(200).json(categoriaAtualizada);
            }else{
                res.status(404).json({message: 'Categoria não encontrada.'});
            }

        }catch(error){
            res.status(500).json({message: 'Erro ao atualizar categoria.', error: error.message});
        }
    };


    exports.deletarCategoria = async (req, res) => {
        try{
            const {id} = req.params;
            const deletada = await Categoria.destroy({
                where: {id: id}
            });

            if(deletada){
                res.status(204).send(); 
            }else{
                res.status(404).json({message: 'Categoria não encontrada.'});
            }
        }catch(error){
            res.status(500).json({message: 'Erro ao deletar categoria.', error: error.message});
        }
    }



    function validarCampos(nome, descricao) {
        let camposValidados = true;

        if (!nome || !descricao) {
            camposValidados = false;
        }

        return camposValidados;
    }