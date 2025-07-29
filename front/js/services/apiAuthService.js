import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiAuthService = {
    async login(email, senha) {
        // 2. Usa um caminho relativo. O proxy do Vite irá redirecionar para http://localhost:3000/api/auth/login
        const response = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async getMe() {
        const response = await fetch(`/api/auth/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async esqueciSenha(email) {
        const response = await fetch(`/api/auth/esqueci-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async redefinirSenha(token, senha) {
        const response = await fetch(`/api/auth/redefinir-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, senha })
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    async logout() {
        const response = await fetch(`/api/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            console.error("A chamada de logout no servidor falhou, mas o cliente será deslogado.");
        }
        return response.json();
    },

    async updatePassword(senhaAtual, novaSenha) {
        const response = await fetch(`/api/auth/update-password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ senhaAtual, novaSenha })
        });
        if (!response.ok) {
            await handleResponseError(response);
        }
        return await response.json();
    }
};
