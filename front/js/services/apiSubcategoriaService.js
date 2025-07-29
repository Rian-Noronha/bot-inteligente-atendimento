import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiSubcategoriaService = {
    /**
     * Cria uma nova subcategoria.
     * @param {object} dados - { nome, descricao, categoria_id }
     */
    async criar(dados) {
        const response = await fetch(`/api/subcategorias`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Atualiza uma subcategoria existente.
     * @param {number} id - O ID da subcategoria a ser atualizada.
     * @param {object} dados - { nome, descricao, categoria_id }
     */
    async atualizar(id, dados) {
        const response = await fetch(`/api/subcategorias/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Deleta uma subcategoria.
     * @param {number} id - O ID da subcategoria a ser deletada.
     */
    async deletar(id) {
        const response = await fetch(`/api/subcategorias/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.status !== 204) { // Deletar retorna 204 No Content
            await handleResponseError(response);
        }
        return true; 
    }
};