import uvicorn
from fastapi import FastAPI
from api.router import api_router 

# Cria a instância principal da aplicação FastAPI
app = FastAPI(
    title="Serviço de IA para Bot de Atendimento",
    description="API para processamento de documentos e busca semântica (RAG).",
    version="1.0.0"
)


# - /api/documents/process
# - /api/ask
# - /api/pendencies
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Status"])
def read_root():
    """O serviço de IA para o Sistema Bot Inteligente (...)."""
    return {"message": "Serviço de IA está operacional."}

# Bloco para permitir a execução direta do ficheiro
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)