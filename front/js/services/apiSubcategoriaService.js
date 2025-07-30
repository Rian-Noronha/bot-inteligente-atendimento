import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiSubcategoriaService = {
    async pegarPorCategoriaId(categoriaId) {
        const response = await fetch(`/api/subcategorias/por-categoria/${categoriaId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        }); 
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async criar(dados) {
        const response = await fetch(`/api/subcategorias`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async atualizar(id, dados) {
        const response = await fetch(`/api/subcategorias/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async deletar(id) {
        const response = await fetch(`/api/subcategorias/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.status !== 204 && !response.ok) {
            await handleResponseError(response);
        }
        return true; 
    }
};