const redisClient = require('../config/redisClient');
const { ChatConsulta, ChatSessao, Subcategoria, ChatResposta, sequelize } = require('../models');
const axios = require('axios');

const AI_SERVICE_ASK_URL = 'http://localhost:8000/api/ask';
const AI_SERVICE_ASK_EMBEDDING_URL = 'http://localhost:8000/api/askembedding/';

exports.criarConsultaEObterResposta = async (req, res) => {
    // transação deve englobar a busca do histórico também
    const t = await sequelize.transaction();
    try {
        const { pergunta, sessao_id, subcategoria_id } = req.body;

        if (!pergunta || !sessao_id || !subcategoria_id) {
            await t.rollback();
            return res.status(400).json({ message: 'Os campos "pergunta", "sessao_id" e "subcategoria_id" são obrigatórios.' });
        }

        // --- cache no redis ---
        const cacheKey = `ia_resposta:${subcategoria_id}:${pergunta.toLowerCase().trim()}`;
        const cachedResponse = await redisClient.get(cacheKey);

        if (cachedResponse) {
            console.log(`[Node.js] CACHE HIT no Redis para a chave: ${cacheKey}`);
            const aiData = JSON.parse(cachedResponse);
            const { answer, source_document_id, source_document_url, source_document_title } = aiData;

            const novaConsulta = await ChatConsulta.create({
                pergunta, sessao_id, subcategoria_id
            }, { transaction: t });

            const novaResposta = await ChatResposta.create({
                texto_resposta: answer,
                consulta_id: novaConsulta.id,
                documento_fonte: source_document_id,
                url_fonte: source_document_url
            }, { transaction: t });

            await t.commit();
            
            return res.status(200).json({
                answer: novaResposta.texto_resposta,
                resposta_id: novaResposta.id,
                consulta_id: novaConsulta.id,
                url_fonte: novaResposta.url_fonte,
                titulo_fonte: source_document_title
            });
        }
        
        console.log(`[Node.js] CACHE MISS no Redis. Continuando fluxo...`);

        // --- BUSCAR E FORMATAR O HISTÓRICO AQUI ---
        console.log(`[Node.js] Buscando histórico recente para a sessão: ${sessao_id}`);
        const history = await ChatConsulta.findAll({
            where: { sessao_id: sessao_id },
            include: [{ model: ChatResposta, as: 'resposta', required: true }], // Garante que só venham consultas com respostas
            order: [['createdAt', 'DESC']],
            limit: 5,
            transaction: t // busca dentro da mesma transação
        });

        // Formata o histórico para o formato que a API Python espera
        const formattedHistory = history.reverse().map(consulta => ({
            pergunta: consulta.pergunta,
            texto_resposta: consulta.resposta ? consulta.resposta.texto_resposta : ''
        }));
        console.log(`[Node.js] Encontrados ${formattedHistory.length} turnos no histórico.`);

        // --- gerar o embedding e efetuar a consulta ---
        let perguntaEmbedding = null;
        try {
            const embeddingResponse = await axios.post(AI_SERVICE_ASK_EMBEDDING_URL, { text: pergunta });
            perguntaEmbedding = embeddingResponse.data.embedding;
        } catch (embError) {
            console.error("[Node.js] Falha ao gerar embedding para a pergunta:", embError.message);
        }

        const novaConsulta = await ChatConsulta.create({
            pergunta,
            sessao_id,
            subcategoria_id,
            embedding: perguntaEmbedding
        }, { transaction: t });

        // --- chamando a ia com histórico no payload ---
        const responseIA = await axios.post(AI_SERVICE_ASK_URL, {
             question: pergunta,
             sessao_id: sessao_id,
             subcategoria_id: subcategoria_id,
             chat_history: formattedHistory 
        });
        
        const { answer, source_document_id, source_document_url, source_document_title } = responseIA.data;
        if (!answer) throw new Error("O serviço de IA não retornou uma resposta de texto válida.");
        
        await redisClient.set(cacheKey, JSON.stringify(responseIA.data), { EX: 3600 });
        
        const novaResposta = await ChatResposta.create({
            texto_resposta: answer,
            consulta_id: novaConsulta.id,
            documento_fonte: source_document_id,
            url_fonte: source_document_url
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            answer: answer,
            resposta_id: novaResposta.id,
            consulta_id: novaConsulta.id,
            url_fonte: novaResposta.url_fonte,
            titulo_fonte: source_document_title
        });

    } catch (error) {
        await t.rollback();
        console.error("Erro no fluxo de consulta e resposta:", error.message);
        res.status(500).json({ message: `Erro ao processar a pergunta: ${error.message}` });
    }
};

/**
 * Lista todas as consultas de uma sessão específica.
 */
exports.pegarConsultasPorSessao = async (req, res) => {
    try {
        const { sessao_id } = req.params;
        const consultas = await ChatConsulta.findAll({
            where: { sessao_id: sessao_id },
            include: [{ model: Subcategoria, as: 'subcategoria', attributes: ['nome'] }],
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(consultas);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar consultas da sessão.", error: error.message });
    }
};