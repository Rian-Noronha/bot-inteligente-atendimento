import { apiAuthService } from '../services/apiAuthService.js';

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutos
let timeoutInterval;

/**
 * Função unificada de logout.
 * Limpa o estado da sessão e redireciona para o login.
 */
export async function logoutUser(alertMessage = null) {
    // Para o monitoramento de atividade para evitar chamadas repetidas.
    clearInterval(timeoutInterval);
    
    // Mostra uma mensagem apenas se uma for fornecida.
    if (alertMessage) {
        alert(alertMessage);
    }
    
    try {
        // Tenta invalidar a sessão no backend, seguro falhar se o token já for inválido
        await apiAuthService.logout();
    } catch (error) {
        console.error("Erro ao notificar o servidor sobre o logout:", error);
    } finally {
        // Limpa o estado local e redireciona, independentemente do resultado da API.
        // Usar removeItem é mais seguro do que clear() para não apagar outros dados do localStorage.
        localStorage.removeItem('authToken');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('active_session_id');
        localStorage.removeItem('last_activity_time');
        sessionStorage.removeItem('my_tab_session_id');
        
        window.location.href = '../index.html';
    }
}

/**
 * Verifica se a sessão desta aba é válida
 * em comparação com o estado global (localStorage).
 * @param {boolean} isInitialCheck - True se for a primeira verificação ao carregar a página.
 */
function validateCurrentTabSession(isInitialCheck = false) {
    const activeSessionId = localStorage.getItem('active_session_id');
    const myTabSessionId = sessionStorage.getItem('my_tab_session_id');

    // CASO 1: Não há nenhuma sessão ativa no navegador.
    // Isso significa que o usuário fez logout em alguma aba.
    if (!activeSessionId) {
        // Se esta aba ACHAVA que estava em uma sessão, ela está obsoleta. Faça o logout.
        if (myTabSessionId) {
            // Evita um alerta desnecessário na verificação inicial se a aba for aberta após o logout.
            const message = isInitialCheck ? null : 'Sua sessão foi encerrada.';
            logoutUser(message);
        }
        return; // Nenhuma outra verificação é necessária.
    }

    // CASO 2: Existe uma sessão ativa no navegador.
    if (!myTabSessionId) {
        // Se esta aba não tem um ID de sessão, significa que é uma nova aba se juntando a uma sessão existente.
        // Atribua o ID da sessão ativa a esta aba.
        sessionStorage.setItem('my_tab_session_id', activeSessionId);
    } else if (myTabSessionId !== activeSessionId) {
        // Se o ID desta aba é DIFERENTE do ID da sessão ativa, ela está obsoleta.
        // Isso acontece quando um novo login é feito em outra aba.
        logoutUser('Sua sessão foi encerrada porque você se conectou em uma nova aba ou janela.');
    }
    // Se myTabSessionId === activeSessionId, a sessão está correta. Não faz nada.
}


function resetTimeoutTimer() {
    localStorage.setItem('last_activity_time', Date.now());
}

function checkTimeout() {
    const lastActivityTime = parseInt(localStorage.getItem('last_activity_time') || Date.now(), 10);
    if (Date.now() - lastActivityTime > TIMEOUT_DURATION) {
        logoutUser('Sua sessão expirou por inatividade. Por favor, faça login novamente.');
    }
}

/**
 * Inicia a escuta por eventos de mudança no localStorage vindos de outras abas.
 */
function listenForCrossTabChanges() {
    window.addEventListener('storage', (event) => {
        // Reage apenas se as chaves relevantes para a sessão forem alteradas.
        if (event.key === 'active_session_id' || event.key === 'authToken') {
            validateCurrentTabSession();
        }
    });
}

/**
 * Função principal exportada. Inicia todo o monitoramento da sessão.
 */
export function startSessionManagement() {
    // Verificação de segurança primária. Se não há token, não há sessão.
    if (!localStorage.getItem('authToken')) {
        // Redireciona silenciosamente. Se o usuário não está logado, ele deve ir para o login.
        // Isso evita o alerta "Acesso negado" que poderia ser irritante ao usuário
        window.location.href = '../index.html';
        return;
    }

    
    // 1. Valida a aba atual assim que a página carrega.
    validateCurrentTabSession(true);

    // 2. Configura o monitoramento de inatividade.
    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimeoutTimer));
    timeoutInterval = setInterval(checkTimeout, 5000);
    
    // 3. Começa a escutar por mudanças de outras abas.
    listenForCrossTabChanges();
    
    // 4. Reseta o timer de atividade uma última vez para garantir que ele comece a contar a partir de agora.
    resetTimeoutTimer();
}