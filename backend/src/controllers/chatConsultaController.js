const redisClient = require('../config/redisClient');
const { ChatConsulta, ChatSessao, Subcategoria, ChatResposta, sequelize } = require('../models');
const axios = require('axios');
const { validarCamposObrigatorios } = require('../utils/validation');
const AI_SERVICE_ASK_URL = 'http://localhost:8000/api/ask';
const AI_SERVICE_ASK_EMBEDDING_URL = 'http://localhost:8000/api/askembedding/';

const withTransaction = (fn) => async (req, res) => {
    const t = await sequelize.transaction();
    try {
        await fn(req, res, t);
        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error; // Lança o erro para o asyncHandler tratar
    }
};

/**
 * @description Realiza a consulta ao chatbot, busca em cache, histórico, gera embedding e obtém resposta da IA.
 */
exports.criarConsultaEObterResposta = withTransaction(async (req, res, t) => {
    const { pergunta, sessao_id, subcategoria_id } = req.body;

    if (!validarCamposObrigatorios([pergunta, sessao_id, subcategoria_id])) {
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

        const documentoFonteFinal = source_document_id === 0 ? null : source_document_id

        const novaResposta = await ChatResposta.create({
            texto_resposta: answer,
            consulta_id: novaConsulta.id,
            documento_fonte: documentoFonteFinal,
            url_fonte: source_document_url
        }, { transaction: t });
        
        return res.status(200).json({
            answer: novaResposta.texto_resposta,
            resposta_id: novaResposta.id,
            consulta_id: novaConsulta.id,
            source_document_id: source_document_id,
            url_fonte: novaResposta.url_fonte,
            titulo_fonte: source_document_title
        });
    }

    console.log(`[Node.js] CACHE MISS no Redis. Continuando fluxo...`);

    // --- BUSCAR E FORMATAR O HISTÓRICO AQUI ---
    console.log(`[Node.js] Buscando histórico recente para a sessão: ${sessao_id}`);
    const history = await ChatConsulta.findAll({
        where: { sessao_id: sessao_id },
        include: [{ model: ChatResposta, as: 'resposta', required: true }],
        order: [['createdAt', 'DESC']],
        limit: 5,
        transaction: t // busca dentro da mesma transação
    });

    const formattedHistory = history.reverse().map(consulta => ({
        pergunta: consulta.pergunta,
        texto_resposta: consulta.resposta ? consulta.resposta.texto_resposta : ''
    }));
    console.log(`[Node.js] Encontrados ${formattedHistory.length} turnos no histórico.`);

    // --- gerar o embedding e efetuar a consulta ---
    let perguntaEmbedding = null;
    try { // O try/catch para a chamada externa à IA deve está, pois é uma falha específica
          // que pode não invalidar a transação principal ou queira ser tratada localmente.
          // Se o embedding falhar, a transação continua, mas sem o embedding.
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
    if (!answer) {
        throw { status: 500, message: "O serviço de IA não retornou uma resposta de texto válida." };
    }

    await redisClient.set(cacheKey, JSON.stringify(responseIA.data), { EX: 3600 });

    const documentoFonteFinal = source_document_id === 0 ? null : source_document_id;

    const novaResposta = await ChatResposta.create({
        texto_resposta: answer,
        consulta_id: novaConsulta.id,
        documento_fonte: documentoFonteFinal,
        url_fonte: source_document_url
    }, { transaction: t });

    res.status(201).json({
        answer: answer,
        resposta_id: novaResposta.id,
        consulta_id: novaConsulta.id,
        source_document_id: source_document_id,
        url_fonte: novaResposta.url_fonte,
        titulo_fonte: source_document_title
    });
});

/**
 * Lista todas as consultas de uma sessão específica.
 */
exports.pegarConsultasPorSessao = async (req, res) => {
    const { sessao_id } = req.params;
    const consultas = await ChatConsulta.findAll({
        where: { sessao_id: sessao_id },
        include: [{ model: Subcategoria, as: 'subcategoria', attributes: ['nome'] }],
        order: [['createdAt', 'ASC']]
    });
    res.status(200).json(consultas);
};