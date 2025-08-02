const { Feedback, ChatResposta, ChatConsulta } = require('../models');
const axios = require('axios');
const { validarCamposObrigatorios } = require('../utils/validation');
const { urls: aiUrls } = require('../config/aiServiceConfig');

/**
 * Cria um novo feedback para uma resposta.
 * Se o feedback for negativo (util: false), envia a pergunta para o AI Service
 * para análise e criação de um Assunto Pendente.
 */
exports.criarFeedback = async (req, res) => {
    const { util, comentario, nota, resposta_id } = req.body;

    if (!validarCamposObrigatorios([util, resposta_id])) {
        throw { status: 400, message: 'Os campos "util" (true/false) e "resposta_id" são obrigatórios.' };
    }

    const resposta = await ChatResposta.findByPk(resposta_id, {
        include: [{
            model: ChatConsulta,
            as: 'consulta',
        }]
    });
    
    if (!resposta || !resposta.consulta) {
        throw { status: 404, message: 'Resposta ou consulta de chat associada não encontrada.' };
    }

    const novoFeedback = await Feedback.create({ 
        util, 
        comentario, 
        nota, 
        resposta_id,
        consulta_id: resposta.consulta.id, 
    });

    // Se o feedback foi negativo, chama o serviço de IA
    if (util === false) {
        try {
            console.log(`[Node.js] Feedback negativo. Enviando pergunta (Consulta ID: ${resposta.consulta.id}) para o AI Service.`);
            await axios.post(aiUrls.pendencies, {
                question: resposta.consulta.pergunta,
                consulta_id: resposta.consulta.id 
            });

            console.log(`[Node.js] Pergunta enviada com sucesso para análise.`);

        } catch (aiError) {
            // Mesmo se a chamada para a IA falhe, o feedback já foi salvo.
            // Registra o erro no console do backend, mas não o relança
            // para não abortar a operação principal de criação do feedback.
            const errorMessage = aiError.response ? JSON.stringify(aiError.response.data) : aiError.message;
            console.error("[Node.js] Falha ao enviar pergunta para o AI Service:", errorMessage);
        }
    }

    res.status(201).json(novoFeedback);
};

/**
 * Lista todos os feedbacks recebidos.
 */
exports.pegarTodosFeedbacks = async (req, res) => {
    // Removemos o try...catch aqui também
    const feedbacks = await Feedback.findAll({
        include: [{
            model: ChatResposta,
            as: 'resposta',
            attributes: ['id', 'texto_resposta']
        }],
        order: [['createdAt', 'DESC']]
    });
    res.status(200).json(feedbacks);
};