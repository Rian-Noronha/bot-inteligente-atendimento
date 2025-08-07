# Usa uma imagem base leve do Python
FROM python:3.12-slim

# Instala as bibliotecas de sistema necessárias para o Unstructured/OpenCV
# libgl1-mesa-glx é o pacote que fornece libGL.so.1
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Instala o Poetry no sistema global do contêiner
RUN pip install poetry

# Configura o Poetry para não criar um ambiente virtual aninhado
RUN poetry config virtualenvs.create false

# Copia APENAS os arquivos de dependência primeiro
# Isso otimiza o cache do Docker. Esta camada só será reconstruída se as dependências mudarem.
COPY pyproject.toml poetry.lock ./

# Instala apenas as dependências de produção
RUN poetry install --no-root --no-interaction

# Agora, copia o resto do código da sua aplicação
COPY . .

# Expõe a porta que a aplicação vai usar
EXPOSE 8000

# Comando final para rodar a aplicação com 'poetry run'
CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]