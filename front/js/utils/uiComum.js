import { apiAuthService } from '../services/apiAuthService.js'; 
import { startSessionManagement } from './sessionManager.js'; 

export function inicializarUIComum() {
    startSessionManagement(); 

    const hamburger = document.getElementById('hamburger');
    const aside = document.querySelector('aside');
    const logoutButton = document.getElementById('logout-btn');

    if (hamburger && aside) {
        hamburger.addEventListener('click', () => {
            aside.classList.toggle('open');
        });

       
        document.addEventListener('click', (event) => {
            if (aside.classList.contains('open') && !aside.contains(event.target) && !hamburger.contains(event.target)) {
                aside.classList.remove('open');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                await apiAuthService.logout();
            } catch (error) {
                console.error("Erro ao notificar o servidor sobre o logout:", error);
            } finally {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';
            }
        });
    }
}