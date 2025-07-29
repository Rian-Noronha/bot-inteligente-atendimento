from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Carrega e valida as configurações da aplicação a partir de um ficheiro .env.
    Se uma variável obrigatória não for encontrada, a aplicação falhará ao iniciar
    com uma mensagem de erro clara.
    """
    # Configura a pydantic para ler o ficheiro .env na pasta raiz do projeto
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # --- Variáveis da Base de Dados 
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_DATABASE: str

    # --- Chaves de API
    GROQ_API_KEY: str
    GOOGLE_API_KEY: str 

    # --- Configurações dos modelos
    EMBEDDINGS_MODEL_NAME: str = "models/embedding-001" 
    LLM_MODEL_NAME: str = "llama-3.1-8b-instant"
    REASONING_LLM_MODEL_NAME: str = "llama-3.3-70b-versatile"

    # Propriedade para construir a URL de conexão dinamicamente
    @property
    def DATABASE_URL(self) -> str:
        """Constrói a URL de conexão do SQLAlchemy a partir das variáveis."""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"

try:
    settings = Settings()
except Exception as e:
    print("ERRO FATAL: Falha ao carregar as configurações. Verifique o seu ficheiro .env.")
    print(f"Detalhes: {e}")
    exit()

