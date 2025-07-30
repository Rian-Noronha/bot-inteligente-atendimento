import { apiAuthService } from './services/apiAuthService.js';

document.addEventListener('DOMContentLoaded', () => {

    const resetPasswordForm = document.getElementById('reset-password-form');

    // Pega o token da URL assim que a página carrega.
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const formMessage = document.getElementById('form-message');
    const notificationContainer = document.getElementById('notification-container');
    const showFormMessage = (message, isError = false) => {
        formMessage.textContent = message;
        formMessage.style.color = isError ? 'red' : '#333';
        formMessage.style.display = 'block';
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => { notification.remove(); }, 4500);
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
         if (newPassword.length < 6) {
            showFormMessage('A nova senha deve ter no mínimo 6 caracteres.', true);
            return;
        }

        if (newPassword !== confirmPassword) {
            showFormMessage('As senhas não conferem. Tente novamente.', true);
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