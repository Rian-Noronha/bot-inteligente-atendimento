import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiKnowledgeLibraryService = {
     /**
     * Busca documentos de forma paginada e com filtro de busca.
     */
    async pegarTodos({ page = 1, limit = 10, search = '' }) {
        const params = new URLSearchParams({ page, limit, search });
        const response = await fetch(`/api/documentos?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json(); 
    },

    /**
     * Busca um documento por ID.
     */
    async pegarPorId(id) {
        const response = await fetch(`/api/documentos/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Cria um novo documento (ou vários, se for por upload do arquivo pdf/docx).
     */
    async criar(dados) {
        const response = await fetch(`/api/documentos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Atualiza um documento existente.
     */
    async atualizar(id, dados) {
        const response = await fetch(`/api/documentos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Deleta um documento.
     */
    async deletar(id) {
        const response = await fetch(`/api/documentos/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.status !== 204 && !response.ok) {
            await handleResponseError(response);
        }
        return true;
    }
};