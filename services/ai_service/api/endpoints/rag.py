import traceback
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser 
from schemas.document import AskRequest, RespostaFormatada
from models.loader import embeddings_model, llm_principal
from config.database import engine

router = APIRouter()
DEFAULT_HNSW_EF_SEARCH = 100
SIMILARITY_THRESHOLD_FOR_CACHE = 0.95

@router.post(
    "/",
    summary="Responde a uma pergunta usando Cache, Memória, Reescrita e RAG"
)
async def ask_question(request: AskRequest):
    """
    Recebe uma pergunta e o histórico da conversa, aplica a lógica de reescrita
    e busca na base de conhecimento para gerar uma resposta formatada.
    """
    try:
        with engine.begin() as connection:
            # --- ETAPA 1: BUSCA NO CACHE SEMÂNTICO ---
            initial_question_embedding = embeddings_model.embed_query(request.question)
            
            connection.execute(
                text("SET LOCAL hnsw.ef_search = :ef_search"),
                {"ef_search": DEFAULT_HNSW_EF_SEARCH}
            )

            print(f"Buscando no cache semântico para a pergunta: '{request.question}'")
            similar_question_query = text("""
                SELECT 
                    cr.texto_resposta, cr.url_fonte, d.titulo AS titulo_fonte,
                    (1 - (c.embedding <=> (:query_vector)::vector)) AS similarity
                FROM chat_consultas c 
                JOIN chat_respostas cr ON c.id = cr.consulta_id
                LEFT JOIN documentos d ON cr.documento_fonte = d.id
                WHERE c.embedding IS NOT NULL 
                ORDER BY c.embedding <=> (:query_vector)::vector 
                LIMIT 1;
            """)
            cached_result = connection.execute(
                similar_question_query,
                {"query_vector": initial_question_embedding}
            ).mappings().fetchone()

            if cached_result and cached_result['similarity'] > SIMILARITY_THRESHOLD_FOR_CACHE:
                print(f"✅ CACHE SEMÂNTICO HIT! Similaridade: {cached_result['similarity']:.4f}")
                return {
                    "answer": cached_result['texto_resposta'],
                    "source_document_id": None,
                    "source_document_url": cached_result['url_fonte'],
                    "source_document_title": cached_result['titulo_fonte']
                }
            
            if cached_result:
                print(f"CACHE SEMÂNTICO MISS. Similaridade: {cached_result['similarity']:.4f}")
            else:
                print("CACHE SEMÂNTICO MISS.")

            # --- ETAPA 2 e 2.5: MEMÓRIA E REESCRITA DA PERGUNTA ---
            rewritten_question = request.question
            
            # Utiliza o histórico recebido diretamente do payload do Node.js
            if request.chat_history:
                formatted_history = []
                for turn in request.chat_history:
                    formatted_history.append(f"Operador: {turn.pergunta}")
                    formatted_history.append(f"IA: {turn.texto_resposta}")
                chat_history = "\n".join(formatted_history)
                
                print(f"Histórico recebido do Node.js. Re-escrevendo a pergunta...")
                
                rewrite_prompt = ChatPromptTemplate.from_template(
                    """A sua tarefa é refinar a 'Pergunta de Acompanhamento' de um operador para uma busca.

                    **Regra Principal:** Se a 'Pergunta de Acompanhamento' já for uma pergunta clara e completa, a sua resposta deve ser EXATAMENTE a 'Pergunta de Acompanhamento', sem qualquer alteração.

                    **Regra Secundária:** Se a pergunta for curta ou ambígua (ex: "e a solução?"), use o 'Histórico da Conversa' para criar uma pergunta completa, combinando o tópico anterior com a pergunta atual.

                    **REGRA DE SAÍDA CRÍTICA:** A sua resposta deve conter APENAS o texto da pergunta final. Não inclua explicações, prefixos, ou o seu processo de raciocínio.

                    ---
                    **Exemplo 1 (Pergunta já completa):**
                    Histórico da Conversa:
                    Operador: qual o motivo do bloqueio por spc?
                    IA: É aplicado quando o cliente tem restrição no CPF.
                    Pergunta de Acompanhamento: qual o procedimento para o bloqueio jurídico?
                    Pergunta Re-escrita: qual o procedimento para o bloqueio jurídico?

                    **Exemplo 2 (Pergunta curta):**
                    Histórico da Conversa:
                    Operador: Motivo de Suspensão de crédito?
                    IA: Ocorre por inatividade ou atrasos pontuais.
                    Pergunta de Acompanhamento: qual a solução?
                    Pergunta Re-escrita: Qual a solução para a suspensão de crédito?
                    ---

                    **Dados Atuais:**

                    Histórico da Conversa:
                    {chat_history}
                    ---
                    Pergunta de Acompanhamento: {question}
                    ---
                    Pergunta Re-escrita:"""
                )
                
                rewrite_chain = rewrite_prompt | llm_principal | StrOutputParser()
                
                rewritten_question = rewrite_chain.invoke({
                    "chat_history": chat_history,
                    "question": request.question
                })
                print(f"-> Pergunta Original: '{request.question}'")
                print(f"-> Pergunta Re-escrita para busca: '{rewritten_question}'")

            # --- ETAPA 3: BUSCA RAG ---
            rag_question_embedding = embeddings_model.embed_query(rewritten_question)
            
            print(f"Prosseguindo com RAG para '{rewritten_question}' (top_k={request.top_k})")
            
            rag_query_parts = [
                """SELECT id, titulo, descricao, solucao, "urlArquivo", 
                   (1 - (embedding <=> (:query_vector)::vector)) AS similarity
                   FROM documentos"""
            ]
            
            where_clauses = ["ativo = true"]
            query_params = {
                "query_vector": rag_question_embedding,
                "similarity_threshold": request.similarity_threshold,
                "top_k": request.top_k
            }

            if request.subcategoria_id is not None:
                where_clauses.append("subcategoria_id = :subcategoria_id")
                query_params["subcategoria_id"] = request.subcategoria_id
            
            where_clauses.append("(1 - (embedding <=> (:query_vector)::vector)) > :similarity_threshold")
            
            rag_query_parts.append(f"WHERE {' AND '.join(where_clauses)}")
            rag_query_parts.append("ORDER BY embedding <=> (:query_vector)::vector")
            rag_query_parts.append("LIMIT :top_k;")
            rag_query_text = " ".join(rag_query_parts)

            rag_results = connection.execute(text(rag_query_text), query_params).mappings().all()

            if not rag_results:
                print("!!! RAG FALHOU: Nenhum documento encontrado.")
                return {"answer": "Desculpe, não encontrei nenhuma informação sobre isso.", "source_document_id": None, "source_document_url": None, "source_document_title": None}

            print("\n--- Documentos Encontrados pelo RAG (com Scores) ---")
            for doc in rag_results:
                print(f"  - ID: {doc['id']:<4} | Score: {doc['similarity']:.4f} | Título: '{doc['titulo']}'")
            print("------------------------------------------------------\n")
            
            
            # --- ETAPA 4: GERAÇÃO DE RESPOSTA COM STRUCTURED OUTPUT ---
            print(f"Encontrados {len(rag_results)} documentos. Consolidando para análise pelo LLM.")
            formatted_contexts = []
            for i, doc in enumerate(rag_results):
                context_str = f"Contexto {i+1} (ID: {doc['id']}): Título: '{doc['titulo']}'. Solução: {doc['solucao']}"
                formatted_contexts.append(context_str)
            full_context = "\n".join(formatted_contexts)

            structured_llm = llm_principal.with_structured_output(RespostaFormatada)
            
            rerank_prompt = ChatPromptTemplate.from_template(
                """A sua tarefa é analisar os 'Contextos' para responder à 'Pergunta Atual'. Use a ferramenta `RespostaFormatada`.
                1. Analise todos os contextos.
                2. Com base no contexto mais relevante, formule uma resposta clara.
                3. Se nenhum for relevante, responda que não encontrou a informação.
                4. Preencha os campos da ferramenta `RespostaFormatada` com o texto da resposta e o ID do documento fonte. Use 0 como ID se nenhum for relevante.
                Contextos: {context}
                Pergunta Atual: {question}"""
            )

            chain = rerank_prompt | structured_llm
            llm_output_obj = chain.invoke({"context": full_context, "question": rewritten_question})

            # --- ETAPA 5: PROCESSAMENTO E RETORNO ---
            final_answer = llm_output_obj.resposta_texto
            source_id = llm_output_obj.id_fonte

            # Lógica para encontrar o documento fonte, com fallback para o primeiro resultado do RAG
            source_doc = next((doc for doc in rag_results if doc['id'] == source_id), rag_results[0])
            
            print(f"Resposta final gerada. Fonte escolhida: ID {source_doc['id']}")
            
            # A responsabilidade de salvar o histórico agora é do Node.js
            return {
                "answer": final_answer,
                "source_document_id": source_doc['id'],
                "source_document_url": source_doc['urlArquivo'],
                "source_document_title": source_doc['titulo']
            }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
