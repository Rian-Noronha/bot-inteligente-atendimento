const { Feedback, ChatResposta, ChatConsulta } = require('../models');
const axios = require('axios');
const AI_SERVICE_PENDENCIES_URL = 'http://localhost:8000/api/pendencies/';

/**
 * Cria um novo feedback para uma resposta.
 * Se o feedback for negativo (util: false), envia a pergunta para o AI Service
 * para análise e criação de um Assunto Pendente.
 */
exports.criarFeedback = async (req, res) => {
    try {
        const { util, comentario, nota, resposta_id } = req.body;

        if (util === undefined || !resposta_id) {
            return res.status(400).json({ message: 'Os campos "util" (true/false) e "resposta_id" são obrigatórios.' });
        }

        const resposta = await ChatResposta.findByPk(resposta_id, {
            include: [{
                model: ChatConsulta,
                as: 'consulta',
            }]
        });
        
        if (!resposta || !resposta.consulta) {
            return res.status(404).json({ message: 'Resposta ou consulta de chat associada não encontrada.' });
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
                
                // Chama o endpoint /api/pendencies/ 
                await axios.post(AI_SERVICE_PENDENCIES_URL, {
                    question: resposta.consulta.pergunta,
                    consulta_id: resposta.consulta.id 
                });

                console.log(`[Node.js] Pergunta enviada com sucesso para análise.`);

            } catch (aiError) {
                // Mesmo se a chamada para a IA falhe, o feedback já foi salvo.
                // registra o erro no console do backend.
                const errorMessage = aiError.response ? aiError.response.data : aiError.message;
                console.error("[Node.js] Falha ao enviar pergunta para o AI Service:", errorMessage);
            }
        }

        res.status(201).json(novoFeedback);

    } catch (error) {
        console.error("Erro ao registrar feedback:", error);
        res.status(500).json({ message: "Erro ao registrar feedback.", error: error.message });
    }
};

/**
 * Lista todos os feedbacks recebidos.
 */
exports.pegarTodosFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.findAll({
            include: [{
                model: ChatResposta,
                as: 'resposta',
                attributes: ['id', 'texto_resposta']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar feedbacks.", error: error.message });
    }
};