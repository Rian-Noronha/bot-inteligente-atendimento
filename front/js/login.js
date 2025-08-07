import { apiLoginService } from './services/apiLoginService.js';
import { isValidEmail } from './utils/validators.js';
import { auth } from './config/firebase.js';
import { signInWithCustomToken } from 'firebase/auth';

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
        const submitButton = loginForm.querySelector('button[type="submit"]');

        if (!email || !password) {
            showMessage('Por favor, preencha os campos de e-mail e senha.', true);
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('Por favor, insira um formato de e-mail válido.', true);
            return;
        }

        try {
            submitButton.disabled = true;
            showMessage('Validando credenciais...');
            
            // 1. Chama a API de login do seu backend
            const loginData = await apiLoginService.login(email, password);

            if (loginData.token && loginData.usuario && loginData.firebaseCustomToken) {
                // 2. Salva os dados da sua API no localStorage
                localStorage.setItem('authToken', loginData.token);
                localStorage.setItem('firebaseCustomToken', loginData.firebaseCustomToken); // <-- SALVANDO O TOKEN DO FIREBASE
                localStorage.setItem('loggedInUser', JSON.stringify(loginData.usuario));
                localStorage.setItem('active_session_id', loginData.usuario.sessionId);
                
                // 3. Autentica no Firebase com o token customizado
                await signInWithCustomToken(auth, loginData.firebaseCustomToken);
                console.log("Autenticação com Firebase bem-sucedida!");

                // 4. Inicia o timer de inatividade
                localStorage.setItem('last_activity_time', Date.now());

                // 5. Redireciona com base no perfil do utilizador
                const perfilNome = loginData.usuario.perfil.nome.toLowerCase();
                if (perfilNome === 'administrador') {
                    window.location.href = './pages/dashboard.html';
                } else {
                    window.location.href = './pages/chatbot.html';
                }
            } else {
                throw new Error('Resposta de login inválida do servidor.');
            }

        } catch (error) {
            console.error('Falha no login:', error);
            showMessage('E-mail ou senha incorretos. Por favor, tente novamente.', true);
            submitButton.disabled = false;
        }
    });
});
