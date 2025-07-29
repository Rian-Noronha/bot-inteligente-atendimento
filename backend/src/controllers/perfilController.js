const { Perfil } = require('../models');
    exports.pegarTodosPerfis = async (req, res) => {
        try {
            const perfis = await Perfil.findAll();
            res.status(200).json(perfis);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar perfis', error: error.message });
        }
    };

    exports.pegarPerfilPorId = async(req, res) => {
        try{
            const {id} = req.params;
            const perfil = await Perfil.findByPk(id);

            if(perfil){
                res.status(200).json(perfil);
            }else{
                res.status(404).json({message: 'Perfil não encontrado.'});
            }
        }catch(error){
            res.status(500).json({message: 'Erro ao buscar perfil.', error: error.message});
        }
    }

    exports.criarPerfil = async (req, res) => {
    
        try {
            const { nome, descricao } = req.body;
            if (!validarCampos(nome, descricao)) {
                return res.status(400).json({ message: 'Os campos nome e descrição são obrigatórios.' });
            }
            
            const novoPerfil = await Perfil.create({ nome, descricao });
            res.status(201).json(novoPerfil);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar perfil.', error: error.message });
        }
    };

    exports.atualizarPerfil = async (req, res) => { 
       

        try {
            const { id } = req.params;
            const { nome, descricao } = req.body;

            const [atualizado] = await Perfil.update({ nome, descricao }, {
                where: { id: id }
            });

            if (atualizado) {
                const perfilAtualizado = await Perfil.findByPk(id);
                res.status(200).json(perfilAtualizado);
            } else {
                res.status(404).json({ message: 'Perfil não encontrado.' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar perfil.', error: error.message });
        }
    };

    exports.deletarPerfil = async (req, res) => {
        
        try {
            const { id } = req.params;
            const deletado = await Perfil.destroy({
                where: { id: id }
            });

            if (deletado) {
                res.status(204).send(); // Sucesso, sem corpo de resposta
            } else {
                res.status(404).json({ message: 'Perfil não encontrado.' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao deletar perfil.', error: error.message });
        }
    };


    function validarCampos(nome, descricao) {
        let camposValidados = true;

        if (!nome || !descricao) {
            camposValidados = false;
        }

        return camposValidados;
    }