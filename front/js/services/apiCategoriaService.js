import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiCategoriaService = {
    /**
     * Busca categorias de forma paginada.
     */
    async pegarPaginada(page = 1, limit = 10, search = '') {
        const queryParams = new URLSearchParams({ page, limit, search });
        const response = await fetch(`/api/categorias?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },
    
    async criar(dados) {
        const response = await fetch(`/api/categorias`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async atualizar(id, dados) {
        const response = await fetch(`/api/categorias/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async deletar(id) {
        const response = await fetch(`/api/categorias/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.status !== 204 && !response.ok) {
            await handleResponseError(response);
        }
        return true;
    }
};