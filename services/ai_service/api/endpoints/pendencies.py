from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
import datetime
import traceback
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from schemas.document import PendenciaRequest, SugestaoIA
from models.loader import llm_categorizador
from config.database import engine

router = APIRouter()

@router.post(
    "/",
    summary="Cria um Assunto Pendente com Análise de IA",
    description="Recebe uma pergunta com feedback negativo, usa IA para categorizar e salva para revisão.",
    status_code=status.HTTP_201_CREATED
)
async def criar_assunto_pendente_com_ia(request: PendenciaRequest):
    """
    Ponto de entrada que o backend Node.js chama após um feedback negativo.
    Este endpoint orquestra a análise da pergunta por uma IA, a criação
    de novas categorias/subcategorias se necessário, e o registro do novo
    assunto pendente no banco de dados.
    """
    try:
        with engine.begin() as connection:
            # --- 1. BUSCAR CATEGORIAS EXISTENTES PARA DAR CONTEXTO À IA ---
            categorias_result = connection.execute(text("SELECT id, nome FROM categorias"))
            categorias_existentes = {row[1].lower(): row[0] for row in categorias_result}
            lista_nomes_categorias = list(categorias_existentes.keys())

            # --- 2. CONFIGURAR O PARSER E O PROMPT COM LANGCHAIN ---
            parser = PydanticOutputParser(pydantic_object=SugestaoIA)
            prompt_template = ChatPromptTemplate.from_messages([
                ("human", """Você é um especialista em organização de base de conhecimento. Sua tarefa é analisar a pergunta de um usuário e estruturá-la para um novo registro.
                Siga o formato de saída JSON abaixo:
                {format_instructions}

                **Regras Mandatórias:**
                1.  **Título:** Crie um breve descrição que resuma a pergunta.
                2.  **Categoria:** Analise a pergunta e compare com a "Lista de Categorias Existentes".
                    - Se a pergunta se encaixar BEM em uma das categorias existentes, use EXATAMENTE o nome da categoria da lista.
                    - Se NENHUMA categoria existente for adequada, crie um NOME CURTO E CONCISO para uma NOVA categoria (1-3 palavras).
                3.  **Subcategoria:** Crie um nome específico e detalhado para a subcategoria, representando o assunto exato da pergunta.

                **Lista de Categorias Existentes:**
                `{lista_categorias}`

                **Pergunta do Usuário:**
                `{pergunta}`
                """)
            ])
            
            # --- 3. CRIAR E EXECUTAR A CHAIN ---
            chain = prompt_template | llm_categorizador | parser
            sugestoes = chain.invoke({
                "format_instructions": parser.get_format_instructions(),
                "lista_categorias": ', '.join(lista_nomes_categorias) if lista_nomes_categorias else 'Nenhuma',
                "pergunta": request.question
            })
            
            titulo = sugestoes.titulo_sugerido
            categoria_sugerida_nome = sugestoes.categoria_sugerida.strip()
            subcategoria_sugerida_nome = sugestoes.subcategoria_sugerida.strip()

            # --- 4. EXECUTAR A DECISÃO DA IA NO BANCO DE DADOS ---
            categoria_final_id = None
            
            if categoria_sugerida_nome.lower() in categorias_existentes:
                categoria_final_id = categorias_existentes[categoria_sugerida_nome.lower()]
            else:
                print(f"Criando nova categoria sugerida pela IA: '{categoria_sugerida_nome}'")
                res = connection.execute(
                    text("INSERT INTO categorias (nome, descricao, \"createdAt\", \"updatedAt\") VALUES (:nome, :desc, :now, :now) RETURNING id"),
                    {"nome": categoria_sugerida_nome, "desc": f"Criada via IA: {request.question[:50]}...", "now": datetime.datetime.now(datetime.timezone.utc)}
                ).fetchone()
                categoria_final_id = res[0]

            print(f"Criando nova subcategoria sugerida pela IA: '{subcategoria_sugerida_nome}'")
            res = connection.execute(
                text("INSERT INTO subcategorias (categoria_id, nome, descricao, \"createdAt\", \"updatedAt\") VALUES (:cat_id, :nome, :desc, :now, :now) RETURNING id"),
                {"cat_id": categoria_final_id, "nome": subcategoria_sugerida_nome, "desc": f"Criada via IA: {request.question[:50]}...", "now": datetime.datetime.now(datetime.timezone.utc)}
            ).fetchone()
            subcategoria_final_id = res[0]

            connection.execute(text("""
                INSERT INTO assuntos_pendentes (consulta_id, texto_assunto, datahora_sugestao, subcategoria_id, "createdAt", "updatedAt") 
                VALUES (:consulta_id, :titulo, :data, :sub_id, :now, :now)
            """), {
                "consulta_id": request.consulta_id,
                "titulo": titulo,
                "data": datetime.datetime.now(datetime.timezone.utc),
                "sub_id": subcategoria_final_id,
                "now": datetime.datetime.now(datetime.timezone.utc)
            })

        return {"message": "Assunto pendente criado com sucesso para análise.", "dados_processados": sugestoes.model_dump()}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ocorreu um erro interno no processamento da IA: {str(e)}")