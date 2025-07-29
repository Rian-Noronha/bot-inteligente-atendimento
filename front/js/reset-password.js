import { apiAuthService } from './services/apiAuthService.js';

document.addEventListener('DOMContentLoaded', () => {

    const resetPasswordForm = document.getElementById('reset-password-form');

    // Pega o token da URL assim que a página carrega.
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // se não houver token, a página é inútil.
    if (!token) {
        alert('Link de redefinição de senha inválido ou ausente. Por favor, solicite um novo.');
        resetPasswordForm.innerHTML = "<h2>Token não encontrado na URL.</h2>";
        setTimeout(() => { window.location.href = './esqueci-senha.html'; }, 3000);
        return; // Para a execução do restante do script
    }

    // Adiciona o listener ao formulário para lidar com o envio.
    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

        // Validação do lado do cliente
        if (!newPassword || !confirmPassword || newPassword !== confirmPassword) {
            alert('As senhas não conferem ou estão em branco. Tente novamente.');
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Redefinindo...';

            const data = await apiAuthService.redefinirSenha(token, newPassword);

            alert(data.message);
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);

        } catch (error) {
            console.error('Falha ao redefinir senha:', error);
            alert(`Erro: ${error.message}`);
            submitButton.disabled = false;
            submitButton.textContent = 'Redefinir Senha';
        }
    });
});