-- Habilita a extensão pgvector, essencial para o tipo 'vector' e suas funções.
CREATE EXTENSION IF NOT EXISTS vector;

-- As tabelas (documentos, chat_consultas) precisam ser criadas
-- pelas migrações do backend ANTES de criar os índices.
-- Por isso, estes comandos de índice estão comentados por enquanto.
-- Executá-los manualmente APÓS rodar as migrações.

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS documentos_embedding_idx
-- ON public.documentos
-- USING hnsw (embedding vector_l2_ops);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_consultas_embedding_idx
-- ON public.chat_consultas
-- USING hnsw (embedding vector_l2_ops);
