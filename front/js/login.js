import { apiLoginService } from './services/apiLoginService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password'); 
    const formMessage = document.getElementById('form-message');
    const loginMessageBox = document.getElementById('login-message-box');
    const reasons = {
        'inactivity': 'Sua sessão expirou por inatividade. Por favor, faça login novamente.',
        'new_login': 'Sua sessão foi encerrada porque você se conectou em uma nova aba.',
        'logged_out': 'Sua sessão foi encerrada em outra aba.',
        'invalid_token': 'Sua sessão expirou ou é inválida. Por favor, faça o login novamente.'
    };

    const urlParams = new URLSearchParams(window.location.search);
    const reasonKey = urlParams.get('reason');

    if (reasonKey && reasons[reasonKey]) {
        loginMessageBox.textContent = reasons[reasonKey];
        loginMessageBox.style.display = 'block'; // Torna a caixa de mensagem visível
        // Adicione uma classe para estilização (ex: cor de fundo)
        loginMessageBox.classList.add('info'); // ou 'error', dependendo do seu CSS
    }

    // Limpa qualquer sessão antiga ao chegar na página de login para evitar erros "fantasma".
    localStorage.clear();
    sessionStorage.clear();

    const showMessage = (message, isError = false) => {
        formMessage.textContent = message;
        formMessage.style.color = isError? 'red' : '#333';
        formMessage.style.display = 'block';
    }

    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            formMessage.style.display = 'none';
        });
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (email === '' || password === '') {
            showMessage('Não deixe nenhum campo vazio:)', true);
            return;
        }

        try {
            showMessage('Entrando no painel administrativo...');
            
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
            showMessage(error.message, true);
        }
    });
});
