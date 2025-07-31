const firebaseStorageService = require('../services/firebaseStorageService');
const { Documento, Subcategoria, Categoria, PalavraChave, sequelize} = require('../models');
const {Op} = require('sequelize');
const axios = require('axios');
const { validarCamposObrigatorios } = require('../utils/validation');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');
const AI_SERVICE_PROCESS_URL = 'http://localhost:8000/api/documents/process';
const redisClient = require('../config/redisClient')


/**
 * Helper para encapsular transações, revertendo em caso de erro.
 */
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
 * Limpa todas as chaves de resposta do bot no cache Redis,
 * chamada após qualquer alteração na base de conhecimento.
 */
async function limparCacheRespostas(){
    try{
        const keys = await redisClient.keys('ia_resposta:*');
        if(keys.length > 0){
            await redisClient.del(keys);
            console.log(`[Node.js] Cache de respostas da IA (Redis) foi limpo com sucesso. ${keys.length} chaves removidas.`);
        }
    }catch(error){
        console.error('[Node.js] Erro ao tentar limpar o cache do Redis:', error);
    }
}


/**
 * opera criação manual do processamento de texto/arquivo.
 * O frontend determina qual fluxo seguir e envia os dados apropriados.
 */
exports.criarDocumento = withTransaction(async (req, res, t) => {
    const {
        titulo,
        descricao,
        solucao,
        subcategoria_id,
        palavrasChave, // Vem como array de strings, exemplo: ['termo1', 'termo2']
        urlArquivo,
        caminhoArquivo,
        tipoArquivo
    } = req.body;

    if (!validarCamposObrigatorios([titulo, descricao, subcategoria_id])) {
        throw { status: 400, message: 'Os campos "titulo", "descricao" e "subcategoria_id" são obrigatórios.' };
    }

    // 1. Monta o payload para enviar as informações de texto para a IA
    const payloadParaIA = {
        titulo,
        descricao,
        subcategoria_id,
        palavras_chave: palavrasChave || [], // Garante que é um array, mesmo que vazio
        solucao: solucao || null,
        url_arquivo: urlArquivo || null
    };
    
    console.log(`[Node.js] Enviando dados para o serviço de IA para criação:`, payloadParaIA);

    let responseIA;
    try {
        // 2. Chama a IA para processar o conteúdo
        responseIA = await axios.post(AI_SERVICE_PROCESS_URL, payloadParaIA);
    } catch (error) {
        if (error.response) {
            throw { status: error.response.status || 500, message: `Erro da API de IA ao processar o documento: ${JSON.stringify(error.response.data)}` };
        }
        throw { status: 500, message: `Erro ao conectar com o serviço de IA: ${error.message}` };
    }

    const documentosProcessadosDaIA = responseIA.data.data;
    if (!documentosProcessadosDaIA || documentosProcessadosDaIA.length === 0) {
        throw { status: 500, message: 'O serviço de IA não retornou documentos processados válidos.' };
    }
    console.log(`[Node.js] IA retornou ${documentosProcessadosDaIA.length} documento(s) para salvar.`);

    const documentosCriados = [];

    // 3. Itera sobre cada documento retornado pela IA para salvá-lo
    for (const docData of documentosProcessadosDaIA) {
        // Cria o documento com os dados da IA + os dados do arquivo original
        const novoDocumento = await Documento.create({
            // Dados vindos da IA
            titulo: docData.titulo,
            descricao: docData.descricao,
            solucao: docData.solucao,
            embedding: docData.embedding,
            subcategoria_id: docData.subcategoria_id,
            
            // Adiciona os campos do arquivo original a CADA chunk salvo.
            // valores recebidos do frontend, não os da IA.
            urlArquivo: urlArquivo,
            caminhoArquivo: caminhoArquivo,
            tipoArquivo: tipoArquivo,
            ativo: true,
        }, { transaction: t });

        // Lógica para associar as palavras-chave
        if (docData.palavras_chave && docData.palavras_chave.length > 0) {
            const promises = docData.palavras_chave.map(p => PalavraChave.findOrCreate({
                where: { palavra: p.trim().toLowerCase() },
                defaults: { palavra: p.trim().toLowerCase() },
                transaction: t
            }));
            const results = await Promise.all(promises);
            const palavrasChaveInstances = results.map(result => result[0]);
            await novoDocumento.addPalavrasChave(palavrasChaveInstances, { transaction: t });
        }
        
        documentosCriados.push(novoDocumento);
    }

    await limparCacheRespostas(); // Limpa o cache após a transação ser bem-sucedida e comitada

    res.status(201).json({
        message: 'Documento(s) processado(s) e salvo(s) com sucesso.',
        documentos_criados: documentosCriados.length
    });
});


/**
 * atualização passa pelo serviço de IA para recalcular o embedding.
 */
exports.atualizarDocumento = withTransaction(async (req, res, t) => {
    const { id } = req.params;
    const { palavrasChaveIds, ...dadosDocumento } = req.body;
    const documento = await Documento.findByPk(id, { transaction: t });

    if (!documento) {
        throw { status: 404, message: 'Documento não encontrado.' };
    }
    
    // Prepara o payload para o serviço de IA recalcular o embedding
    const payloadParaIA = {
        titulo: dadosDocumento.titulo || documento.titulo,
        descricao: dadosDocumento.descricao || documento.descricao,
        subcategoria_id: dadosDocumento.subcategoria_id || documento.subcategoria_id,
        solucao: dadosDocumento.solucao || documento.solucao,
    };

    let responseIA;
    try {
        responseIA = await axios.post(AI_SERVICE_PROCESS_URL, payloadParaIA);
    } catch (error) {
        if (error.response) {
            throw { status: error.response.status || 500, message: `Erro da API de IA ao reprocessar o documento: ${JSON.stringify(error.response.data)}` };
        }
        throw { status: 500, message: `Erro ao conectar com o serviço de IA: ${error.message}` };
    }

    const documentoProcessado = responseIA.data.data[0]; // Pega o único documento processado
    if (!documentoProcessado || !documentoProcessado.embedding) {
        throw { status: 500, message: 'O serviço de IA não retornou um embedding válido para a atualização.' };
    }

    // Atualiza o campo de embedding com o novo valor calculado pela IA
    dadosDocumento.embedding = documentoProcessado.embedding;

    await documento.update(dadosDocumento, { transaction: t });

    if (palavrasChaveIds && Array.isArray(palavrasChaveIds)) {
        await documento.setPalavrasChave(palavrasChaveIds, { transaction: t });
    }

    await limparCacheRespostas();
    
    const documentoAtualizado = await Documento.findByPk(id, {
        attributes: { exclude: ['embedding'] },
        include: [ { model: Subcategoria, as: 'subcategoria' }, { model: PalavraChave, as: 'palavrasChave' }]
    });
    res.status(200).json(documentoAtualizado);
});


// --- Funções de Leitura e Deleção ---
exports.pegarTodosDocumentos = async (req, res) => {
    const { page, limit, offset, search } = getPaginationParams(req.query);
    
    let whereClause = {};
    const includeClause = [
        {
            model: Subcategoria,
            as: 'subcategoria',
            attributes: [],
            include: [{ model: Categoria, as: 'categoria', attributes: [] }]
        },
        {
            model: PalavraChave,
            as: 'palavrasChave',
            attributes: [],
            through: { attributes: [] }
        }
    ];

    if (search) {
        const searchTerm = `%${search}%`;
        whereClause = {
            [Op.or]: [
                { titulo: { [Op.iLike]: searchTerm } },
                { descricao: { [Op.iLike]: searchTerm } },
                { solucao: { [Op.iLike]: searchTerm } },
                { '$subcategoria.nome$': { [Op.iLike]: searchTerm } },
                { '$subcategoria.categoria.nome$': { [Op.iLike]: searchTerm } },
                { '$palavrasChave.palavra$': { [Op.iLike]: searchTerm } }
            ]
        };
    }

    const { count, rows } = await Documento.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        attributes: { exclude: ['embedding'] },
        include: [
            {
                model: Subcategoria,
                as: 'subcategoria',
                attributes: ['nome'],
                include: [{ model: Categoria, as: 'categoria', attributes: ['nome'] }]
            },
            {
                model: PalavraChave,
                as: 'palavrasChave',
                attributes: ['id', 'palavra'],
                through: { attributes: [] }
            }
        ],
        order: [['id', 'DESC']]
    });

    const response = {
        documentos: rows,
        meta: {
            totalItems: count,
            itemsPerPage: limit,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        }
    };

    res.status(200).json(response);
};

exports.pegarDocumentoPorId = async (req, res) => {
    const { id } = req.params;
    const documento = await Documento.findByPk(id, {
        attributes: { exclude: ['embedding'] },
        include: [
            { model: Subcategoria, as: 'subcategoria', attributes: ['nome'], include: [{ model: Categoria, as: 'categoria', attributes: ['nome'] }] },
            { model: PalavraChave, as: 'palavrasChave', attributes: ['id', 'palavra'], through: { attributes: [] } }
        ]
    });
    if (documento) {
        res.status(200).json(documento);
    } else {
        throw { status: 404, message: 'Documento não encontrado.' };
    }
};

exports.deletarDocumento = withTransaction(async (req, res, t) => {
    const { id } = req.params;
    
    const documentoParaDeletar = await Documento.findByPk(id, { transaction: t });

    if (!documentoParaDeletar) {
        throw { status: 404, message: 'Documento não encontrado.' };
    }

    const caminhoDoArquivo = documentoParaDeletar.caminhoArquivo;
    
    await documentoParaDeletar.destroy({ transaction: t });

    let mensagemFinal = 'Parágrafo deletado com sucesso.';

    if (caminhoDoArquivo) {
        // Conta os registros restantes DENTRO da mesma transação
        const count = await Documento.count({
            where: { caminhoArquivo: caminhoDoArquivo },
            transaction: t
        });

        if (count === 0) {
            // Se o arquivo não tem mais registros associados, deleta do Firebase
            // Chamar o deleteFileByPath FORA da transação do Sequelize,
            // pois se a transação der rollback, o arquivo não terá sido deletado indevidamente.
            // E também, se o Firebase falhar, não queremos dar rollback no banco.
            try {
                await firebaseStorageService.deleteFileByPath(caminhoDoArquivo);
                mensagemFinal = 'Último parágrafo deletado, e o arquivo original foi removido do Storage.';
            } catch (firebaseError) {
                console.error(`[Node.js] Erro ao deletar arquivo do Firebase Storage: ${firebaseError.message}`);
                mensagemFinal = 'Parágrafo deletado. Houve um erro ao remover o arquivo original do Storage, por favor, verifique manualmente.';
            }
        } else {
            mensagemFinal = `Parágrafo deletado. O arquivo foi mantido para outros ${count} registros.`;
        }
    }

    await limparCacheRespostas(); 
    
    res.status(200).json({ message: mensagemFinal });
});
