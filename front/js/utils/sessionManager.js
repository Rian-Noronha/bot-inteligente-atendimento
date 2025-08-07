import { apiAuthService } from '../services/apiAuthService.js';
import { getAuth, signOut } from 'firebase/auth';

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutos
let timeoutInterval;

/**
 * Função unificada de logout.
 * Limpa o estado da sessão e redireciona para o login com um motivo.
 * @param {string} reasonKey - Uma chave que identifica o motivo do logout (ex: 'inactivity', 'new_login').
 */
export async function logoutUser(reasonKey = null) {
    clearInterval(timeoutInterval);

    try {
        await apiAuthService.logout();
    } catch (error) {
        console.error("Erro ao notificar o servidor sobre o logout:", error);
    } finally {
        try {

            const auth = getAuth();
            if (auth.currentUser) {
                await signOut(auth);
                console.log("Sessão do Firebase encerrada no cliente.");
            }

        } catch (error) {
            console.error("Erro ao fazer logout do Firebase:", error);
        }

        localStorage.clear();
        sessionStorage.clear();

        let redirectUrl = '../index.html';
        if (reasonKey) {
            redirectUrl += `?reason=${reasonKey}`;
        }
        window.location.href = redirectUrl;
    }
}

function validateCurrentTabSession(isInitialCheck = false) {
    const activeSessionId = localStorage.getItem('active_session_id');
    const myTabSessionId = sessionStorage.getItem('my_tab_session_id');

    if (!activeSessionId) {
        if (myTabSessionId) {
            // Se a aba foi desconectada por outra, não mostre a mensagem na verificação inicial.
            const reason = isInitialCheck ? null : 'logged_out';
            logoutUser(reason);
        }
        return;
    }

    if (!myTabSessionId) {
        sessionStorage.setItem('my_tab_session_id', activeSessionId);
    } else if (myTabSessionId !== activeSessionId) {
        // Motivo: um novo login foi feito em outra aba.
        logoutUser('new_login');
    }
}

function resetTimeoutTimer() {
    localStorage.setItem('last_activity_time', Date.now());
}

function checkTimeout() {
    const lastActivityTime = parseInt(localStorage.getItem('last_activity_time') || Date.now(), 10);
    if (Date.now() - lastActivityTime > TIMEOUT_DURATION) {
        // Motivo: inatividade.
        logoutUser('inactivity');
    }
}

function listenForCrossTabChanges() {
    window.addEventListener('storage', (event) => {
        if (event.key === 'active_session_id' || event.key === 'authToken') {
            validateCurrentTabSession();
        }
    });
}

export function startSessionManagement() {
    if (!localStorage.getItem('authToken')) {
        // Redireciona silenciosamente, sem motivo, pois o usuário simplesmente não está logado.
        window.location.href = '../index.html';
        return;
    }
    
    validateCurrentTabSession(true);

    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimeoutTimer));
    timeoutInterval = setInterval(checkTimeout, 5000);
    
    listenForCrossTabChanges();
    resetTimeoutTimer();
}