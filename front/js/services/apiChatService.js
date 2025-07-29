import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiChatService = {

    /**
     * Inicia uma nova sessão de chat.
     */
    async iniciarSessao() {
        const response = await fetch(`/api/chat/iniciar-sessao`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Envia uma nova pergunta (consulta) para o backend.
     * @param {object} dadosConsulta - Contém pergunta, sessao_id e subcategoria_id.
     */
    async criarConsultaEObterResposta(dadosConsulta) {
        const response = await fetch(`/api/chat/consultas`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosConsulta)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Envia o feedback do utilizador sobre uma resposta.
     * @param {object} dadosFeedback - Contém util (true/false) e resposta_id.
     */
    async criarFeedback(dadosFeedback) {
        const response = await fetch(`/api/feedbacks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosFeedback)
        });
        if (!response.ok) await handleResponseError(response);
        return await response.json();
    },

    /**
     * Encerra a sessão de chat ativa de forma segura.
     * Esta função é chamada quando o usuário sai da página do chat.
     * @param {number} sessaoId - O ID da sessão a ser encerrada.
     */
    encerrarSessao(sessaoId) {
        // A URL corresponde à rota PUT definida no backend
        const url = `/api/chat/encerrar-sessao/${sessaoId}`;

        // 'fetch' com 'keepalive: true', forma moderna e segura de garantir o envio
        // de uma requisição final, pois permite o uso do método PUT e o envio 
        // de cabeçalhos de autorização, fazendo com que o middleware 'protect' funcione.
        fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            keepalive: true 
        });
    
        // Não é necessário .then() ou await, pois a intenção é apenas "disparar e esquecer"
        // a requisição enquanto a página fecha.
    }
};