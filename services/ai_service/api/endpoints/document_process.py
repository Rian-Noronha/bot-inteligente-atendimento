from fastapi import APIRouter, HTTPException
from schemas.document import DocumentProcessRequest
from core.document_analyzer import process_and_generate_chunks
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/",
    summary="Processa e Prepara Documentos para Cadastro",
    tags=["Análise de Documentos"]
)
async def process_document_endpoint(request: DocumentProcessRequest):
    """
    Ponto de entrada ÚNICO que o backend Node.js chama.
    Recebe os metadados e ou um texto de 'solucao' ou uma 'url_arquivo'.
    Retorna uma lista de documentos (chunks) com seus embeddings, prontos
    para serem salvos no banco de dados pelo Node.js.
    """
    logger.info(f"Iniciando processamento para o documento '{request.titulo}'")
    try:
        documents_to_save = await process_and_generate_chunks(request)
        
        message = f"Processamento concluído. {len(documents_to_save)} documento(s) prontos para salvamento."
        logger.info(f"Sucesso no processamento do documento '{request.titulo}': {message}")
        
        return {
            "message": message,
            "data": documents_to_save
        }
        
    except ValueError as e:
        logger.warning(f"Erro de validação ao processar documento '{request.titulo}': {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Erro inesperado ao processar o documento '{request.titulo}'")
        raise HTTPException(status_code=500, detail="Ocorreu um erro inesperado no processamento do documento.")