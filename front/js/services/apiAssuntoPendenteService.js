import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiAssuntoPendenteService = {
    /**
     * Busca todos os assuntos pendentes.
     */
    async pegarTodosPendentes() {
        // 2. Usa um caminho relativo para o proxy do Vite funcionar
        const response = await fetch(`/api/assuntos-pendentes`, {
            method: 'GET',
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
