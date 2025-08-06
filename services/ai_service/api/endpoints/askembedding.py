from fastapi import APIRouter, HTTPException
from schemas.document import AskEmbeddingRequest
from models.loader import embeddings_model
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", summary="Gera um embedding para um texto")
async def create_embedding(request: AskEmbeddingRequest):
    """
    Recebe um texto e retorna sua representação vetorial (embedding).
    """
    logger.info(f"Gerando embedding para o texto: '{request.text[:50]}...'")

    try:
        embedding = embeddings_model.embed_query(request.text)

        logger.debug("Embedding gerado com sucesso.")
        return {"embedding": embedding}
    except Exception as e:
        logger.exception(f"Falha ao gerar embedding para o texto: '{request.text[:50]}...'")
        raise HTTPException(
            status_code=500,
            detail="Ocorreu um erro ao gerar o embedding."
        )