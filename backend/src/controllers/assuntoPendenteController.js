const { AssuntoPendente, ChatConsulta, Subcategoria, Categoria } = require('../models'); // Importe o model Categoria também

//listar assuntos pendentes com subcategoria vinculada à sua categoria
exports.pegarAssuntosPendentes = async (req, res) => {
    try {
        const assuntos = await AssuntoPendente.findAll({
            include: [
                {
                    model: ChatConsulta,
                    as: 'consulta',
                    attributes: ['pergunta']
                },
                {
                    // Inclui a Subcategoria...
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nome'], // Pega o ID e o nome da subcategoria
                    // ...e DENTRO dela, inclui a Categoria pai.
                    include: [{
                        model: Categoria,
                        as: 'categoria',
                        attributes: ['nome'] // Pega apenas o nome da categoria
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(assuntos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar assuntos pendentes.", error: error.message });
    }
};


exports.criarAssuntoPendente = async (req, res) => {
    try {
        const { consulta_id, texto_assunto, subcategoria_id } = req.body;

        if (!validarCampos(consulta_id, texto_assunto, subcategoria_id)) {
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

    } catch (error) {
        res.status(500).json({ message: "Erro ao criar assunto pendente.", error: error.message });
    }
};


exports.atualizarStatusAssunto = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar assunto pendente.", error: error.message });
    }
};


exports.deletarAssuntoPendente = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await AssuntoPendente.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Assunto pendente não encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar assunto pendente.", error: error.message });
    }
};


function validarCampos(consulta_id, texto_assunto, subcategoria_id){
    let validados = true;
    if(!consulta_id || !texto_assunto || !subcategoria_id){
        validados = false;
    }

    return validados;
}