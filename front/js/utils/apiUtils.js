import { logoutUser } from './sessionManager';

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
 * Se o erro for 401 (Não Autorizado), chama a função de logout centralizada.
 * Para outros erros, extrai a mensagem do servidor.
 */
export async function handleResponseError(response) {
    if (response.status === 401) {
        logoutUser('invalid_token');
        throw new Error('Sessão inválida, redirecionando para o login.'); 
    }
    
    // PARA TODOS OS OUTROS ERROS (404, 409, 500, etc.):
    try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ocorreu um erro desconhecido no servidor.');
    } catch (e) {
        throw new Error(e.message || `Erro ${response.status}: ${response.statusText}`);
    }
}