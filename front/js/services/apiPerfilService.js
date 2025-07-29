import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiPerfilService = {
    /**
     * Busca todos os perfis
     */
    async pegarTodos() {
        const response = await fetch(`/api/perfis`, {
            headers: getAuthHeaders() 
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Busca um único perfil pelo seu ID.
     */
    async pegarPorId(id) {
        const response = await fetch(`/api/perfis/${id}`, {
            headers: getAuthHeaders() 
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Cria um novo perfil.
     */
    async criar(dadosPerfil) {
        const response = await fetch(`/api/perfis`, {
            method: 'POST',
            headers: getAuthHeaders(), 
            body: JSON.stringify(dadosPerfil)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Atualiza um perfil existente.
     */
    async atualizar(id, novosDados) {
        const response = await fetch(`/api/perfis/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(), 
            body: JSON.stringify(novosDados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Deleta um perfil.
     */
    async deletar(id) {
        const response = await fetch(`/api/perfis/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders() 
        });
        if (response.status !== 204 && !response.ok) {
            await handleResponseError(response);
        }
        return true;
    }
};
