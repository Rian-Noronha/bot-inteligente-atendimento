import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiAssuntoPendenteService = {
    /**
     * Busca assuntos pendentes com paginação e busca.
     * Chama a rota: GET /api/assuntos-pendentes
     * @param {number} page - O número da página.
     * @param {number} limit - O número de itens por página.
     * @param {string} search - O termo de busca.
     */
    async pegarPaginado(page = 1, limit = 10, search = '') {
        const queryParams = new URLSearchParams({ page, limit, search });
        const response = await fetch(`/api/assuntos-pendentes?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Busca TODOS os assuntos pendentes, sem paginação.
     * Chama a rota: GET /api/assuntos-pendentes/todos
     */
    async pegarTodos() {
        const response = await fetch(`/api/assuntos-pendentes/todos`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Atualiza o status de um assunto pendente (ex: para 'aprovado' ou 'descartado').
     * @param {number} id - O ID do assunto a ser atualizado.
     * @param {string} status - O novo status ('aprovado' ou 'descartado').
     */
    async atualizarStatus(id, status) {
        const response = await fetch(`/api/assuntos-pendentes/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: status })
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

     /**
     * Deleta um assunto pendente.
     * @param {number} id - O ID do assunto a ser deletado.
     */
    async deletarAssuntoPendente(id){
        const response = await fetch(`/api/assuntos-pendentes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if(!response.ok) await handleResponseError(response);
        
        return;
    }
};
