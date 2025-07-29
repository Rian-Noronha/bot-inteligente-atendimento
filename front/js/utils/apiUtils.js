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
 * Se o erro for 401 (Não Autorizado), desloga o usuário automaticamente.
 * @param {Response} response - O objeto de resposta do fetch.
 */
export async function handleResponseError(response) {
    if (response.status === 401) {
        alert('Sua sessão expirou ou é inválida. Por favor, faça login novamente.');
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../index.html'; // Ajuste o caminho para sua página de login
        throw new Error('Não autorizado.'); // Interrompe a execução
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ocorreu um erro na requisição do servidor.');
}
