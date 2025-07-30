import { apiAuthService } from "./services/apiAuthService.js";

document.addEventListener('DOMContentLoaded', () => {

    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const formContainer = document.getElementById('form-container');
    const confirmationContainer = document.getElementById('confirmation-container');
    const goToEmailBtn = document.getElementById('go-to-email-btn'); // Pega o novo botão
    const formMessage = document.getElementById('form-message');
    const isValidEmail = (email) => {
        const emailRegex = new RegExp(
            /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
        );
        return emailRegex.test(email);
    };
    const showFormMessage = (message, isError = true) => {
        formMessage.textContent = message;
        formMessage.style.color = isError ? '#ff5252' : '#008145'; // Vermelho para erro, verde para sucesso
        formMessage.style.display = 'block';
    };


    // Adiciona o listener ao formulário
    forgotPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();

        if (!email) {
            showFormMessage('Por favor, insira seu endereço de e-mail.');
            return;
        }

        if (!isValidEmail(email)) {
            showFormMessage('Por favor, insira um formato de e-mail válido.');
            return;
        }

        const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            await apiAuthService.esqueciSenha(email);
            
            // Esconde o formulário e mostra a mensagem de confirmação
            formContainer.style.display = 'none';
            confirmationContainer.style.display = 'flex';

            // --- LÓGICA DO BOTÃO INTELIGENTE ---
            // Extrai o domínio do e-mail digitado pelo usuário
            const domain = email.split('@')[1].toLowerCase();
            let webmailUrl = null;

            // Mapeia os domínios mais comuns para seus respectivos links
            switch (domain) {
                case 'gmail.com':
                    webmailUrl = 'https://mail.google.com/';
                    break;
                case 'outlook.com':
                case 'hotmail.com':
                case 'live.com':
                    webmailUrl = 'https://outlook.live.com/';
                    break;
                case 'yahoo.com':
                case 'yahoo.com.br':
                    webmailUrl = 'https://mail.yahoo.com/';
                    break;
            }

            // Se o domínio for conhecido, atualiza o link do botão e o exibe
            if (webmailUrl) {
                goToEmailBtn.href = webmailUrl;
                goToEmailBtn.style.display = 'inline-block';
            }

        } catch (error) {
            console.error('Falha ao solicitar recuperação de senha:', error);
            showFormMessage(`Ocorreu um erro: ${error.message}`);
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Link de Recuperação';
        }
    });
});