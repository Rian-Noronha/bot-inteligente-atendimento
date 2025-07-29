const { ChatResposta, ChatConsulta, Documento } = require('../models');

exports.criarResposta = async (req, res) => {
    try {
        // 1. Extrai o novo campo 'url_fonte' do corpo da requisição
        const { texto_resposta, consulta_id, documento_fonte, url_fonte } = req.body;

        if (!texto_resposta || !consulta_id) {
            return res.status(400).json({ message: 'Os campos "texto_resposta" e "consulta_id" são obrigatórios.' });
        }

        // verificar se a consulta pai existe
        const consulta = await ChatConsulta.findByPk(consulta_id);
        if (!consulta) {
            return res.status(404).json({ message: 'Consulta não encontrada.' });
        }
        
        // verificar se o documento fonte existe, se for fornecido
        if (documento_fonte) {
            const documento = await Documento.findByPk(documento_fonte); 
            if (!documento) {
                return res.status(404).json({ message: 'Documento fonte não encontrado.' });
            }
        }

        // 2. Adiciona 'url_fonte' ao objeto que será salvo no banco
        const novaResposta = await ChatResposta.create({
            texto_resposta,
            consulta_id,
            documento_fonte,
            url_fonte 
        });

        res.status(201).json(novaResposta);

    } catch (error) {
        res.status(500).json({ message: "Erro ao criar resposta.", error: error.message });
    }
};

//pegar resposta de uma consulta específica
exports.pegarRespostaPorConsulta = async (req, res) => {
    try {
        const { consulta_id } = req.params;
        const resposta = await ChatResposta.findOne({
            where: { consulta_id: consulta_id },
            // Inclui o documento fonte para dar mais contexto
            include: [{
                model: Documento,
                as: 'fonte',
                attributes: ['id', 'titulo']
            }]
        });

        if (resposta) {
            res.status(200).json(resposta);
        } else {
            res.status(404).json({ message: 'Nenhuma resposta encontrada para esta consulta.' });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar resposta.", error: error.message });
    }
};
