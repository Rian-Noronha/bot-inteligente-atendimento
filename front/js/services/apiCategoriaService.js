import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiCategoriaService = {
    /**
     * Busca todas as categorias, agora usando um caminho relativo e cabeçalhos centralizados.
     */
    async pegarTodasCategorias() {
        // 2. A URL agora é um caminho relativo, que será interceptado pelo proxy do Vite
        const response = await fetch(`/api/categorias`, {
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
     *  Cria uma nova categoria.
     * @param {object} dados - { nome, descricao }
     */
    async criar(dados) {
        const response = await fetch(`/api/categorias`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Atualiza uma categoria existente.
     * @param {number} id - O ID da categoria a ser atualizada.
     * @param {object} dados - { nome, descricao }
     */
    async atualizar(id, dados) {
        const response = await fetch(`/api/categorias/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Deleta uma categoria.
     * @param {number} id - O ID da categoria a ser deletada.
     */
    async deletar(id) {
        const response = await fetch(`/api/categorias/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        // Deletar com sucesso retorna status 204 e nenhum conteúdo
        if (response.status !== 204) {
            await handleResponseError(response);
        }
        return true; // Retorna sucesso
    }
};
