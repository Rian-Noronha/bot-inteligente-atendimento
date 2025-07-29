from fastapi import APIRouter
from .endpoints import document_process, rag, pendencies, askembedding 

# Cria o roteador principal da API que irá agregar os outros
api_router = APIRouter()


api_router.include_router(
    document_process.router, 
    prefix="/documents/process", 
    tags=["Processamento de Documentos"] 
)

api_router.include_router(
    rag.router, 
    prefix="/ask", 
    tags=["RAG - Perguntas e Respostas"]
)

api_router.include_router(
    pendencies.router,
    prefix="/pendencies", 
    tags=["Assuntos pendentes para aprovação"]
)

api_router.include_router(
    askembedding.router,
    prefix="/askembedding", 
    tags=["Geração de embeddings para perguntas feitas no chat"]
)