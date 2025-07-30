import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiCategoriaService = {

     async pegarTodasCategorias() {
        // 2. A URL agora é um caminho relativo, que será interceptado pelo proxy do Vite
        const response = await fetch(`/api/categorias/todas`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            await handleResponseError(response);
        }
        return await response.json();
    },


      /**
     * Busca as subcategorias de uma categoria específica.
     * @param {number} id - O ID da categoria pai.
     */
    async pegarSubcategoriasPorCategoriaId(id) {
        const response = await fetch(`/api/subcategorias/por-categoria/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        }); 
        if (!response.ok) {
            await handleResponseError(response);
        }
        return await response.json();
    },
    

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