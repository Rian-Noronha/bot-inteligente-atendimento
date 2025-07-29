import { handleResponseError } from '../utils/apiUtils.js';

export const apiLoginService = {
    /**
     * Envia as credenciais para o backend para tentar fazer o login.
     * @param {string} email - O email do utilizador.
     * @param {string} senha - A senha do utilizador.
     * @returns {Promise<object>} - Uma promessa que resolve para os dados de sucesso (token e utilizador).
     */
    async login(email, senha) {
        const response = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            await handleResponseError(response);
        }

        return await response.json();
    }
};
