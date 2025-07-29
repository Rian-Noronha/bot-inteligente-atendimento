import sys
import os
from pathlib import Path

print("--- INICIANDO SCRIPT DE DIAGNÓSTICO DE IMPORTAÇÃO ---")

# Adiciona a pasta do projeto ao caminho de procura do Python
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

print(f"\n[INFO] Caminho do projeto adicionado ao sys.path: {project_root}")
print(f"[INFO] Conteúdo de sys.path (primeiros 5 itens): {sys.path[:5]}")

def check_file(path_to_check):
    """Verifica se um ficheiro ou pasta existe."""
    exists = "Sim" if Path(path_to_check).exists() else "NÃO (PROBLEMA AQUI!)"
    print(f"[VERIFICANDO] O caminho '{path_to_check}' existe? -> {exists}")

# Verifica a existência de todos os ficheiros e pastas cruciais
print("\n--- Verificando a estrutura de ficheiros ---")
check_file(project_root / 'api')
check_file(project_root / 'api' / '__init__.py')
check_file(project_root / 'api' / 'router.py')
check_file(project_root / 'api' / 'endpoints')
check_file(project_root / 'api' / 'endpoints' / '__init__.py')
check_file(project_root / 'api' / 'endpoints' / 'embedding.py')
check_file(project_root / 'api' / 'endpoints' / 'rag.py')
check_file(project_root / 'core' / '__init__.py')
check_file(project_root / 'schemas' / '__init__.py')

print("\n--- Testando a cadeia de importação passo a passo ---")

try:
    print("\n[PASSO 1] A importar 'from api.endpoints import embedding, rag'...")
    from api.endpoints import embedding, rag
    print("   [SUCESSO] Módulos 'embedding' e 'rag' importados.")
except Exception as e:
    print(f"   [FALHA] ERRO AO IMPORTAR OS ENDPOINTS. O problema está aqui.")
    print(f"   Detalhes do erro: {type(e).__name__}: {e}")
    sys.exit(1)

try:
    print("\n[PASSO 2] A importar 'from api.router import api_router'...")
    from api.router import api_router
    print("   [SUCESSO] Módulo 'api_router' importado.")
except Exception as e:
    print(f"   [FALHA] ERRO AO IMPORTAR O ROUTER. O problema está no ficheiro 'api/router.py'.")
    print(f"   Detalhes do erro: {type(e).__name__}: {e}")
    sys.exit(1)

print("\n===================================================================")
print(" DIAGNÓSTICO CONCLUÍDO: Se você chegou até aqui, o problema de importação está resolvido.")
print(" A causa provável era um erro interno num dos ficheiros que foi corrigido.")
print(" Tente executar 'python -m uvicorn main:app --reload' novamente.")
print("===================================================================")
