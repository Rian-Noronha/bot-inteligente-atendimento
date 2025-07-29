from pydantic import BaseModel, ValidationInfo, field_validator, Field
from typing import List, Optional

# ---Schema para um turno da conversa no histórico ---
class ChatHistoryTurn(BaseModel):
    pergunta: str
    texto_resposta: str

# Modelo para a requisição de pergunta ao chatbot
class AskRequest(BaseModel):
    question: str
    similarity_threshold: Optional[float] = Field(0.75, gt=0, le=1)
    top_k: Optional[int] = Field(3, gt=0, le=10) 
    sessao_id: Optional[int] = None,
    subcategoria_id: Optional[int] = None,
    chat_history: Optional[List[ChatHistoryTurn]] = None

# --- Schema para o Processamento de documentos
class DocumentProcessRequest(BaseModel):
    titulo: str
    subcategoria_id: int
    descricao: Optional[str] = None
    palavras_chave: Optional[List[str]] = []
    solucao: Optional[str] = None
    url_arquivo: Optional[str] = None 

    @field_validator('url_arquivo', mode='after')
    def check_solution_or_url(cls, v, info: ValidationInfo):
        if info.data.get('solucao') and v:
            raise ValueError("Forneça apenas 'solucao' ou 'url_arquivo', não ambos.")
        if not info.data.get('solucao') and not v:
            raise ValueError("É necessário fornecer ou 'solucao' (manual) ou 'url_arquivo' (processamento automático).")
        return v


# --- Schema para o receber a pergunta base para gerar o assunto pendente
class PendenciaRequest(BaseModel):
    question: str
    consulta_id: int 


# --- Schema para ser base do assunto pendente gerado
class SugestaoIA(BaseModel):
    titulo_sugerido: str = Field(description="Título curto e direto que resume a pergunta.")
    categoria_sugerida: str = Field(description="O nome da categoria, seja ela existente ou uma nova.")
    subcategoria_sugerida: str = Field(description="O nome da nova e específica subcategoria.")


# --- Schema para a Requisição de askembedding ---
class AskEmbeddingRequest(BaseModel):
    text: str

# --- Schema para a Resposta para o chatbot ---
class RespostaFormatada(BaseModel):
    """A estrutura de dados para a resposta final do assistente."""
    resposta_texto: str = Field(description="O texto da resposta a ser exibido ao usuário.")
    id_fonte: int = Field(description="O ID do documento fonte utilizado. Usar 0 se nenhum for relevante.")