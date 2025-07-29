from config.settings import settings
import google.generativeai as genai
from langchain_groq import ChatGroq
from typing import List

print("A carregar os modelos de IA...")

class GoogleEmbeddingWrapper:
    def __init__(self, api_key: str, model_name: str):
        genai.configure(api_key=api_key)
        self.model_name = model_name

    def embed_query(self, text: str) -> List[float]:
        """Gera embedding para uma única string (pergunta)."""
        result = genai.embed_content(
            model=self.model_name,
            content=text,
            task_type="RETRIEVAL_QUERY"
        )
        return result['embedding']

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Gera embeddings para uma lista de strings (documentos)."""
        result = genai.embed_content(
            model=self.model_name,
            content=texts,
            task_type="RETRIEVAL_DOCUMENT"
        )
        return result['embedding']

# Carrega e inicializa o wrapper do modelo de embeddings do Google
embeddings_model = GoogleEmbeddingWrapper(
    api_key=settings.GOOGLE_API_KEY,
    model_name=settings.EMBEDDINGS_MODEL_NAME
)

# LLM Principal: Usado para responder em cima dos documentos de maior similaridade vindos do banco.
llm_principal = ChatGroq(
    api_key=settings.GROQ_API_KEY, 
    model_name=settings.LLM_MODEL_NAME,
    temperature=0.7, #para as respostas soarem mais naturais
)


# LLM Categorizador: este vai criar novas categorias > subcategorias 
llm_categorizador = ChatGroq(
    api_key=settings.GROQ_API_KEY, 
    model_name=settings.REASONING_LLM_MODEL_NAME, 
    temperature=0.1,
    max_tokens=2048,
    model_kwargs={"response_format": {"type": "json_object"}}
)

print("Modelos de IA carregados com sucesso (Embeddings via Google Gemini).")