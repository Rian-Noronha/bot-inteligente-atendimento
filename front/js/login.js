import { apiLoginService } from './services/apiLoginService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password'); 
    const loginStatusMessage = document.getElementById('login-status-message');

    // Limpa qualquer sessão antiga ao chegar na página de login para evitar erros "fantasma".
    localStorage.clear();
    sessionStorage.clear();
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (email === '' || password === '') {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        try {
            if (loginStatusMessage) {
                loginStatusMessage.textContent = 'A autenticar...';
                loginStatusMessage.style.color = '#333';
                loginStatusMessage.style.display = 'block';
            }

            // Chama a API para tentar fazer o login
            const loginData = await apiLoginService.login(email, password);

            if (loginData.token && loginData.usuario) {
                // 1. Guarda o token e os dados do utilizador no localStorage
                localStorage.setItem('authToken', loginData.token);
                localStorage.setItem('loggedInUser', JSON.stringify(loginData.usuario));

                // 2. Pega o ID da sessão que veio do backend e o usa como validador
                const sessionId = loginData.usuario.sessionId; 
                if (!sessionId) {
                    // Garante que o backend está a enviar o sessionId
                    throw new Error('Falha na autenticação: ID de sessão não recebido do servidor.');
                }
                localStorage.setItem('active_session_id', sessionId);
                sessionStorage.setItem('my_tab_session_id', sessionId);
                localStorage.setItem('last_activity_time', Date.now());

                // 3. Redireciona com base no perfil do utilizador
                const perfilNome = loginData.usuario.perfil.nome;
                if (perfilNome.toLowerCase() === 'administrador') {
                    window.location.href = './pages/dashboard.html';
                } else {
                    window.location.href = './pages/chatbot.html';
                }
            }

        } catch (error) {
            console.error('Falha no login:', error);
            if (loginStatusMessage) {
                loginStatusMessage.textContent = error.message;
                loginStatusMessage.style.color = 'red';
            } else {
                alert(error.message);
            }
        }
    });
});
