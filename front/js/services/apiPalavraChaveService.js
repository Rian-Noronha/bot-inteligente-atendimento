import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiPalavraChaveService = {
    /**
     * Envia um array de strings (palavras) para o backend para serem encontradas ou criadas.
     * @param {string[]} palavras - Um array de palavras.
     */
    async encontrarOuCriarLote(palavras) {
        const response = await fetch(`/api/palavras-chave/lote`, {
            method: 'POST',
            headers: getAuthHeaders(), 
            body: JSON.stringify({ palavras: palavras }) 
        });

        if (!response.ok) {
            await handleResponseError(response);
        }

        return await response.json();
    }
};
