/**
 * Cria e retorna os cabeçalhos de autenticação com o token JWT.
 * @returns {HeadersInit}
 */
export function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Lida com erros de resposta da API de forma padronizada.
 * Se o erro for 401 (Não Autorizado), desloga o utilizador automaticamente.
 * Para outros erros, extrai a mensagem do servidor.
 */
export async function handleResponseError(response) {
    // CASO ESPECIAL: Se o token for inválido ou expirar, desloga o utilizador.
    if (response.status === 401) {
        alert('Sua sessão expirou ou é inválida. Por favor, faça login novamente.');
        // Limpa o estado local para evitar loops de erro
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../index.html';
        throw new Error('Não autorizado.'); 
    }
    
    // PARA TODOS OS OUTROS ERROS (404, 409, 500, etc.):
    try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ocorreu um erro desconhecido no servidor.');
    } catch (e) {
        throw new Error(e.message || `Erro ${response.status}: ${response.statusText}`);
    }
}
