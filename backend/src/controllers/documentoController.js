const firebaseStorageService = require('../services/firebaseStorageService');
const { Documento, Subcategoria, Categoria, PalavraChave, sequelize} = require('../models');
const {Op} = require('sequelize');
const axios = require('axios');
const AI_SERVICE_PROCESS_URL = 'http://localhost:8000/api/documents/process';
const redisClient = require('../config/redisClient')

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
exports.criarDocumento = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { 
            titulo, 
            descricao, 
            solucao, 
            subcategoria_id, 
            palavrasChave,
            urlArquivo,
            caminhoArquivo, 
            tipoArquivo    
        } = req.body;

        // 1. Monta o payload para enviar as informações de texto para a IA
        const payloadParaIA = {
            titulo,
            descricao,
            subcategoria_id,
            palavras_chave: palavrasChave || [],
            solucao: solucao || null,
            url_arquivo: urlArquivo || null
        };
        
        console.log(`[Node.js] Enviando dados para o serviço de IA:`, payloadParaIA);

        // 2. Chama a IA para processar o conteúdo
        const responseIA = await axios.post(AI_SERVICE_PROCESS_URL, payloadParaIA);
        const documentosProcessadosDaIA = responseIA.data.data;
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

        await t.commit();
        await limparCacheRespostas();

        res.status(201).json({ 
            message: 'Documento(s) processado(s) e salvo(s) com sucesso.', 
            documentos_criados: documentosCriados.length 
        });

    } catch (error) {
        await t.rollback();
        let errorMessage = `Erro ao criar documento: ${error.message}`;
        if (error.response) {
            errorMessage = `Erro retornado pela API de IA: ${JSON.stringify(error.response.data)}`;
        }
        console.error("[Node.js] ERRO DETALHADO AO CRIAR DOCUMENTO:", error);
        res.status(500).json({ message: errorMessage });
    }
};


/**
 * atualização passa pelo serviço de IA para recalcular o embedding.
 */
exports.atualizarDocumento = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { palavrasChaveIds, ...dadosDocumento } = req.body;
        const documento = await Documento.findByPk(id);

        if (!documento) {
            await t.rollback();
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }
        
        // Prepara o payload para o serviço de IA recalcular o embedding
        const payloadParaIA = {
            titulo: dadosDocumento.titulo || documento.titulo,
            descricao: dadosDocumento.descricao || documento.descricao,
            subcategoria_id: dadosDocumento.subcategoria_id || documento.subcategoria_id,
            solucao: dadosDocumento.solucao || documento.solucao, // Pega a nova solução
        };

        const responseIA = await axios.post(AI_SERVICE_PROCESS_URL, payloadParaIA);
        const documentoProcessado = responseIA.data.data[0]; // Pega o único documento processado

        // Atualiza o campo de embedding com o novo valor calculado pela IA
        dadosDocumento.embedding = documentoProcessado.embedding;

        await documento.update(dadosDocumento, { transaction: t });

        if (palavrasChaveIds && Array.isArray(palavrasChaveIds)) {
             await documento.setPalavrasChave(palavrasChaveIds, { transaction: t });
        }

        await t.commit();

        await limparCacheRespostas();
        
        const documentoAtualizado = await Documento.findByPk(id, {
            attributes: { exclude: ['embedding'] },
            include: [ { model: Subcategoria, as: 'subcategoria' }, { model: PalavraChave, as: 'palavrasChave' }]
        });
        res.status(200).json(documentoAtualizado);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: `Erro ao atualizar documento: ${error.message}` });
    }
};


// --- Funções de Leitura e Deleção  ---
exports.pegarTodosDocumentos = async (req, res) => {
    try {
        // 1. Extrai os parâmetros
        const { page = 1, limit = 10, search = '' } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        
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

        // 3. PRIMEIRA CONSULTA: Encontra os IDs de TODOS os documentos que correspondem à busca
        const matchingDocuments = await Documento.findAll({
            where: whereClause,
            include: includeClause,
            attributes: ['id'], // Busca apenas os IDs para ser rápido
            group: ['Documento.id'], // Agrupa para garantir IDs únicos
            raw: true, // Retorna dados puros, mais leve
        });

        const totalItems = matchingDocuments.length;
        const documentIds = matchingDocuments.map(doc => doc.id);

        // 4. SEGUNDA CONSULTA: Busca os dados completos, mas apenas para a página atual
        const offset = (parsedPage - 1) * parsedLimit;
        const rows = await Documento.findAll({
            where: {
                id: { [Op.in]: documentIds } // Filtra pelos IDs encontrados
            },
            limit: parsedLimit,
            offset: offset,
            attributes: { exclude: ['embedding'] }, 
            include: [ // buscar os dados completos para exibição
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

        // 5. Retorna a resposta estruturada
        res.status(200).json({
            documentos: rows,
            totalItems: totalItems,
            totalPages: Math.ceil(totalItems / parsedLimit),
            currentPage: parsedPage
        });

    } catch (error) {
        console.error("Erro ao buscar documentos com paginação:", error);
        res.status(500).json({ message: "Erro ao buscar documentos", error: error.message });
    }
};

exports.pegarDocumentoPorId = async (req, res) => {
    try {
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
            res.status(404).json({ message: 'Documento não encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar documento", error: error.message });
    }
};

exports.deletarDocumento = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();

    try {
        const documentoParaDeletar = await Documento.findByPk(id, { transaction: t });

        if (!documentoParaDeletar) {
            await t.rollback();
            return res.status(404).json({ message: 'Documento não encontrado.' });
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
                await firebaseStorageService.deleteFileByPath(caminhoDoArquivo);
                mensagemFinal = 'Último parágrafo deletado, e o arquivo original foi removido do Storage.';
            } else {
                mensagemFinal = `Parágrafo deletado. O arquivo foi mantido para outros ${count} registros.`;
            }
        }

        await t.commit(); // operações (destroy e count) são confirmadas juntas.
        await limparCacheRespostas();
        
        res.status(200).json({ message: mensagemFinal });

    } catch (error) {
        await t.rollback();
        console.error("Erro ao deletar documento:", error);
        res.status(500).json({ message: "Erro ao deletar documento.", error: error.message });
    }
};
