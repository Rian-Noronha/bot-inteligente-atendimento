import requests
import io
import re
from typing import List
from models.loader import embeddings_model
from schemas.document import DocumentProcessRequest
from unstructured.partition.auto import partition
import logging

logger = logging.getLogger(__name__)

async def process_and_generate_chunks(request_data: DocumentProcessRequest) -> List[dict]:
    """
    Processa um documento, divide-o em chunks e gera embeddings para todos 
    os chunks de forma otimizada usando uma única chamada de API em lote.
    """

    logger.info(f"Iniciando processamento e chunking para o documento ID: {request_data.documento_id}")
    
    logical_blocks = []
    fallback_keywords = request_data.palavras_chave


    # --- ETAPA 1: EXTRAIR O TEXTO DO DOCUMENTO ---
    if request_data.url_arquivo:
        logger.info(f"Processando a partir da URL: {request_data.url_arquivo}")
        try:
            logger.debug("Baixando conteúdo do arquivo...")
            response = requests.get(request_data.url_arquivo)
            response.raise_for_status()
            file_content = response.content

            logger.debug("Particionando o arquivo com Unstructured...")
            elements = partition(file=io.BytesIO(file_content), strategy="fast")
            if not elements:
                logger.warning(f"Unstructured não retornou elementos para o arquivo da URL: {request_data.url_arquivo}")
                raise ValueError("Unstructured não retornou elementos do arquivo.")
            logger.info("Conteúdo do arquivo baixado e particionado com sucesso.")

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro de rede ao baixar o arquivo da URL: {e}")
            raise ValueError(f"Não foi possível baixar o arquivo da URL: {request_data.url_arquivo}")
        
        except Exception as e:
            logger.exception(f"Erro inesperado ao processar o arquivo com Unstructured: {e}")
            raise ValueError(f"Erro ao processar o arquivo com Unstructured: {e}")

        full_text = "\n\n".join([el.text for el in elements if el.text.strip()])
        logical_blocks = re.split(r'(?=\n#\s)', full_text)
    
    # Se for entrada manual, o 'logical_blocks' usará os dados manuais.
    elif request_data.solucao:
        logger.info("Processando a partir de texto manual (solucao).")
        manual_text = f"# {request_data.titulo}\nDescrição: {request_data.descricao}\nSolução: {request_data.solucao}"
        logical_blocks = [manual_text]
    else:
        raise ValueError("Forneça 'solucao' ou 'url_arquivo'.")
    
    logger.info(f"Documento dividido em {len(logical_blocks)} bloco(s) lógicos.")

    # --- ETAPA 2: PREPARAR OS DADOS E TEXTOS PARA EMBEDDING ---
    chunks_to_process = []
    texts_for_embedding = []

    for i, chunk_text in enumerate(logical_blocks):
        clean_chunk = chunk_text.strip()
        if not clean_chunk:
            continue

        logger.debug(f"Processando chunk #{i+1}/{len(logical_blocks)}...")

        titulo_final = request_data.titulo
        descricao_final = request_data.descricao
        solucao_final = clean_chunk.lstrip('#').strip()
        palavras_chave_extraidas = ""
        
        match_titulo = re.search(r'#\s*(.*?)(?:\n|Descrição:)', clean_chunk, re.IGNORECASE)
        if match_titulo and match_titulo.group(1).strip():
            titulo_final = match_titulo.group(1).strip()

        match_descricao = re.search(r'Descrição:(.*?)(?=\s*Solução:|\s*Palavras-chave:|$)', clean_chunk, re.DOTALL | re.IGNORECASE)
        if match_descricao and match_descricao.group(1).strip():
            descricao_final = match_descricao.group(1).strip()
        
        match_solucao = re.search(r'Solução:(.*?)(?=\s*Palavras-chave:|$)', clean_chunk, re.DOTALL | re.IGNORECASE)
        if match_solucao and match_solucao.group(1).strip():
            solucao_final = match_solucao.group(1).strip()
        
        match_palavras_chave = re.search(r'Palavras-chave:(.*)', clean_chunk, re.DOTALL | re.IGNORECASE)
        if match_palavras_chave and match_palavras_chave.group(1).strip():
            palavras_chave_extraidas = match_palavras_chave.group(1).strip()
            
        # Prioriza as palavras-chave extraídas do documento. Se não houver, usa as do fallback que vem do front.
        palavras_chave_finais = palavras_chave_extraidas if palavras_chave_extraidas else ", ".join(fallback_keywords)

        texto_para_embedding = f"Título: {titulo_final}\nDescrição: {descricao_final}\nSolução: {solucao_final}"
        if palavras_chave_finais:
            texto_para_embedding += f"\nPalavras-chave: {palavras_chave_finais.strip().rstrip('.')}"

        logger.debug(f"  - Título do chunk: '{titulo_final}'")
        logger.debug(f"  - Texto preparado para embedding (primeiros 100 chars): '{texto_para_embedding[:100]}...'")
       
        texts_for_embedding.append(texto_para_embedding)
        chunks_to_process.append({
            "titulo": titulo_final,
            "descricao": descricao_final,
            "solucao": solucao_final,
             "palavras_chave": [p.strip().rstrip('.') for p in palavras_chave_finais.split(',') if p.strip()]
        })


    # --- ETAPA 3: GERAR EMBEDDINGS EM LOTE  ---
    if not texts_for_embedding:
        logger.warning(f"Nenhum texto válido encontrado para gerar embeddings no documento ID: {request_data.documento_id}")
        return []

    try:
        logger.info(f"Gerando embeddings em lote para {len(texts_for_embedding)} chunks.")
        embeddings = embeddings_model.embed_documents(texts_for_embedding)
        logger.info("Embeddings gerados com sucesso.")
    except Exception as e:
        logger.exception("Falha na chamada para o modelo de embeddings.")
        raise RuntimeError(f"Erro ao gerar embeddings: {e}")

    # --- ETAPA 4: MONTAR A RESPOSTA FINAL ---
    final_documents = []
    for chunk_data, embedding in zip(chunks_to_process, embeddings):
        final_documents.append({
            "titulo": chunk_data["titulo"],
            "descricao": chunk_data["descricao"],
            "solucao": chunk_data["solucao"],
            "palavras_chave": chunk_data["palavras_chave"], 
            "subcategoria_id": request_data.subcategoria_id,
            "embedding": embedding,
            "urlArquivo": request_data.url_arquivo,
            "ativo": True
        })
    logger.info(f"Montagem final concluída. Retornando {len(final_documents)} documentos processados.")
    return final_documents