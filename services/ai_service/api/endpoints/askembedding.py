from fastapi import APIRouter
from schemas.document import AskEmbeddingRequest
from models.loader import embeddings_model

router = APIRouter()

@router.post("/", summary="Gera um embedding para um texto")
async def create_embedding(request: AskEmbeddingRequest):
    """
    Recebe um texto e retorna sua representação vetorial (embedding).
    """
    embedding = embeddings_model.embed_query(request.text)
    return {"embedding": embedding}