import { apiAuthService } from './services/apiAuthService.js';
import { validatePassword } from './utils/validators.js'; 
import { showNotification } from './utils/notifications.js';

document.addEventListener('DOMContentLoaded', () => {

    const resetPasswordForm = document.getElementById('reset-password-form');

    // Pega o token da URL assim que a página carrega.
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const formMessage = document.getElementById('form-message');
    const showFormMessage = (message, isError = false) => {
        formMessage.textContent = message;
        formMessage.style.color = isError ? 'red' : '#333';
        formMessage.style.display = 'block';
    };

    // se não houver token, a página é inútil.
    if (!token) {
        showFormMessage('Link de redefinição inválido ou ausente.', true);
        setTimeout(() => { window.location.href = './esqueci-senha.html'; }, 3000);
        return; // Para a execução do restante do script
    }

    // Adiciona o listener ao formulário para lidar com o envio.
    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        formMessage.style.display = 'none';

        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

        // Validação do lado do cliente
         const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            // Usando showNotification para consistência com as outras telas
            showNotification(passwordValidation.message, 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('As senhas não conferem. Tente novamente.', 'error');
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Redefinindo...';

            const data = await apiAuthService.redefinirSenha(token, newPassword);

           showNotification(data.message, 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);

        } catch (error) {
            console.error('Falha ao redefinir senha:', error);
            showNotification(`Erro: ${error.message}`, 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Redefinir Senha';
        }
    });
});