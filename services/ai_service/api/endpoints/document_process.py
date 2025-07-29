from fastapi import APIRouter, HTTPException
from schemas.document import DocumentProcessRequest
from core.document_analyzer import process_and_generate_chunks

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
    try:
        documents_to_save = await process_and_generate_chunks(request)
        
        return {
            "message": f"Processamento concluído. {len(documents_to_save)} documento(s) prontos para salvamento.",
            "data": documents_to_save
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Erro inesperado no endpoint de análise: {e}")
        raise HTTPException(status_code=500, detail="Ocorreu um erro inesperado no processamento do documento.")