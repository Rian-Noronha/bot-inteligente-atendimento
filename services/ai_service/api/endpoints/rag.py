import logging
from fastapi import APIRouter, HTTPException
from sqlalchemy import text, Connection
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from schemas.document import AskRequest, RespostaFormatada
from models.loader import embeddings_model, llm_principal
from config.database import engine
from config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter()

def _search_semantic_cache(question: str, connection: Connection):
    """Busca por uma pergunta similar no cache semântico."""
    logger.info(f"Buscando no cache semântico para a pergunta: '{question}'")
    embedding = embeddings_model.embed_query(question)
    query = text("""
        SELECT 
            cr.texto_resposta, 
            d.id AS source_document_id,
            d."urlArquivo" AS source_document_url,  -- CORREÇÃO: Buscando da tabela de documentos 'd'
            d.titulo AS source_document_title,
            (1 - (c.embedding <=> (:q_vector)::vector)) AS similarity
        FROM chat_consultas c 
        JOIN chat_respostas cr ON c.id = cr.consulta_id
        LEFT JOIN documentos d ON cr.documento_fonte = d.id
        WHERE c.embedding IS NOT NULL ORDER BY c.embedding <=> (:q_vector)::vector LIMIT 1;
    """)
    result = connection.execute(query, {"q_vector": embedding}).mappings().fetchone()
    
    if result and result['similarity'] > settings.SIMILARITY_THRESHOLD_FOR_CACHE:
        logger.info(f"CACHE SEMÂNTICO HIT! Similaridade: {result['similarity']:.4f}")
        return result
    if result:
       logger.debug(f"CACHE SEMÂNTICO MISS. Similaridade mais próxima: {result['similarity']:.4f}")
    return None

def _rewrite_question_with_history(request: AskRequest) -> str:
    """Reescreve a pergunta usando o histórico, com uma função de limpeza para garantir robustez."""
    if not request.chat_history:
        return request.question

    logger.info("Histórico recebido. Re-escrevendo a pergunta...")
    history = "\n".join([f"Operador: {turn.pergunta}\nIA: {turn.texto_resposta}" for turn in request.chat_history])
    
    # Usando o seu prompt original
    rewrite_prompt = ChatPromptTemplate.from_template(
        """Sua única tarefa é otimizar a 'Pergunta de Acompanhamento' de um operador para uma busca em uma base de conhecimento.

            REGRAS:
            1.  Se a 'Pergunta de Acompanhamento' já for uma pergunta clara e autossuficiente, sua resposta deve ser EXATAMENTE a pergunta original, sem adicionar ou remover nada.
            2.  Se a 'Pergunta de Acompanhamento' for curta, ambígua ou depender do contexto (ex: "e sobre isso?", "qual o procedimento?"), use o 'Histórico da Conversa' para criar uma nova pergunta completa e específica.
            3.  Sua saída deve conter APENAS e SOMENTE o texto da pergunta final. Não inclua NENHUMA outra palavra, explicação, ou formatação como "Pergunta Re-escrita:".

            ---
            Histórico da Conversa:
            {chat_history}
            ---
            Pergunta de Acompanhamento:
            {question}
            ---
            Pergunta Otimizada para Busca:"""
    )
    
    # Função "limpadora" para garantir que a saída seja sempre uma única pergunta
    def clean_llm_output(text_output: str) -> str:
        lines = [line.strip() for line in text_output.splitlines() if line.strip()]
        return lines[-1] if lines else text_output

    chain = rewrite_prompt | llm_principal | StrOutputParser() | RunnableLambda(clean_llm_output)
    rewritten_question = chain.invoke({"chat_history": history, "question": request.question})
    
    logger.debug(f"-> Pergunta Original: '{request.question}'")
    logger.info(f"-> Pergunta Re-escrita para busca: '{rewritten_question}'")
    return rewritten_question

def _perform_rag_retrieval(question: str, top_k: int, subcategoria_id: int | None, connection: Connection):
    """Executa a busca RAG, sempre retornando os top_k melhores resultados, sem filtrar por score."""
    logger.info(f"Prosseguindo com RAG para '{question}' (top_k={top_k}, subcategoria_id={subcategoria_id})")
    embedding = embeddings_model.embed_query(question)
    
    params = {"q_vector": embedding, "top_k": top_k}
    where_clauses = ["ativo = true"]
    if subcategoria_id:
        where_clauses.append("subcategoria_id = :sub_id")
        params["sub_id"] = subcategoria_id

    query_text = f"""
        SELECT id, titulo, descricao, solucao, "urlArquivo", 
               (1 - (embedding <=> (:q_vector)::vector)) AS similarity
        FROM documentos
        WHERE {' AND '.join(where_clauses)}
        ORDER BY embedding <=> (:q_vector)::vector
        LIMIT :top_k;
    """
    results = connection.execute(text(query_text), params).mappings().all()

    if not results:
        logger.warning(f"RAG não retornou documentos para a pergunta: '{question}'")
        return None

    logger.debug("--- Documentos Encontrados pelo RAG (com Scores) ---")
    for doc in results:
        logger.debug(f"  - ID: {doc['id']:<4} | Score: {doc['similarity']:.4f} | Título: '{doc['titulo']}'")
    logger.debug("------------------------------------------------------")
    return results

def _generate_final_answer(context: str, question: str) -> RespostaFormatada:
    """Usa o LLM para analisar o contexto e gerar a resposta final estruturada."""
    logger.info("Consolidando contexto para análise pelo LLM.")
    structured_llm = llm_principal.with_structured_output(RespostaFormatada)
    
    generation_prompt = ChatPromptTemplate.from_template(
    """Você é um assistente especialista e sua única função é extrair respostas literais dos 'Documentos de Referência' para responder à 'Pergunta do Operador'.

        REGRAS FUNDAMENTAIS:
        1.  **SEJA LITERAL:** Sua resposta deve ser baseada **exclusivamente** no texto fornecido. Não interprete, resuma ou adicione informações que não estejam escritas.
        2.  **SIGA A ORDEM:** Se um procedimento descrito no documento tem vários passos (ex: "primeiramente, faça X", "depois, faça Y"), sua resposta DEVE começar pelo primeiro passo. Não pule etapas.
        3.  **RESPOSTA DIRETA:** Encontre a seção do documento que responde diretamente à pergunta e use a informação de lá.
        4.  **CASO DE FALHA:** Se, e somente se, nenhum documento contiver a informação necessária, use a resposta padrão: "Não encontrei uma resposta para esta pergunta na base de conhecimento."

        FORMATO DE SAÍDA OBRIGATÓRIO:
        Sua resposta final DEVE usar a ferramenta `RespostaFormatada` com os seguintes campos:
        - `resposta_texto`: O texto da resposta que você formulou, seguindo as regras acima.
        - `id_fonte`: O ID do documento que você usou para a resposta. Se a regra 4 for aplicada, use o ID 0. **Este valor deve ser sempre um número inteiro (integer), nunca uma string com aspas.**

        ---
        Documentos de Referência:
        {context}
        ---
        Pergunta do Operador:
        {question}"""
    )
    chain = generation_prompt | structured_llm
    return chain.invoke({"context": context, "question": question})



@router.post("/", summary="Responde a uma pergunta usando Cache, Memória, Reescrita e RAG")
async def ask_question(request: AskRequest):
    try:
        with engine.begin() as connection:
            # Etapa 1: Tentar responder com o cache
            cached_response = _search_semantic_cache(request.question, connection)
            if cached_response:
                 logger.info(f"Retornando resposta do cache. Fonte original ID: {cached_response.get('source_document_id')}")
                 return {
                    "answer": cached_response['texto_resposta'],
                    "source_document_id": cached_response['source_document_id'],
                    "source_document_url": cached_response['source_document_url'],
                    "source_document_title": cached_response['source_document_title']
                }

            # Etapa 2: Reescrever a pergunta com base no histórico
            final_question = _rewrite_question_with_history(request)

            # Etapa 3: Buscar documentos relevantes (RAG)
            rag_results = _perform_rag_retrieval(final_question, request.top_k, request.subcategoria_id, connection)
            if not rag_results:
                return {"answer": "Desculpe, não encontrei nenhuma informação sobre isso.", "source_document_id": None, "source_document_url": None, "source_document_title": None}

            # Etapa 4: Gerar a resposta final com base nos documentos
            context = "\n".join([f"Contexto (ID: {doc['id']}): Título: '{doc['titulo']}'. Solução: {doc['solucao']}" for doc in rag_results])
            llm_output = _generate_final_answer(context, final_question)
            
            # Etapa 5: Formatar e retornar a resposta
            if llm_output.id_fonte == 0:
                logger.info("Resposta final gerada. Nenhuma fonte relevante encontrada pelo LLM.")
                return {
                    "answer": llm_output.resposta_texto,
                    "source_document_id": 0,
                    "source_document_url": None,
                    "source_document_title": "Nenhuma fonte encontrada"
                }
            

            source_doc = next((doc for doc in rag_results if doc['id'] == llm_output.id_fonte), rag_results[0])
            
            if not source_doc:
                logger.warning(f"ALERTA: LLM retornou ID de fonte ({llm_output.id_fonte}) que não foi encontrado nos resultados do RAG.")
                # Retorna a resposta do LLM, mas sem link de fonte.
                return {
                    "answer": llm_output.resposta_texto,
                    "source_document_id": llm_output.id_fonte,
                    "source_document_url": None,
                    "source_document_title": "Fonte não localizada"
                }
            
            logger.info(f"Resposta final gerada. Fonte escolhida: ID {source_doc['id']}")
            return {
                "answer": llm_output.resposta_texto,
                "source_document_id": source_doc['id'],
                "source_document_url": source_doc['urlArquivo'],
                "source_document_title": source_doc['titulo']
            }

    except Exception as e:
        logger.exception("Ocorreu um erro inesperado ao processar a pergunta em /ask")
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao processar sua pergunta.")