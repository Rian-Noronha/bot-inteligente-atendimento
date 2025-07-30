import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiCategoriaService = {
    async pegarTodasCategorias() {
        const response = await fetch(`/api/categorias`, {
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