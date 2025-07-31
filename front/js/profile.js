import { apiAuthService } from './services/apiAuthService.js';
import { apiUsuarioService } from './services/apiUsuarioService.js';
import { showNotification } from './utils/notifications.js';
import { isValidEmail, validatePassword } from './utils/validators.js';
import { inicializarUIComum } from './utils/uiComum.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUIComum();

    const profileForm = document.getElementById('profile-form');
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const accessTypeInput = document.getElementById('profile-access-type');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    
    let currentUser = null;

    async function inicializarPagina() {
        try {
            currentUser = await apiAuthService.getMe();
            
            if (currentUser) {
                nameInput.value = currentUser.nome;
                emailInput.value = currentUser.email;
                accessTypeInput.value = currentUser.perfil ? currentUser.perfil.nome : 'Não definido';

                if (!currentUser.perfil || currentUser.perfil.nome.toLowerCase() !== 'administrador') {
                    accessTypeInput.disabled = true;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do perfil:', error);
            showNotification('Não foi possível carregar seus dados. A sua sessão pode ter expirado.', 'error');
        }
    }

    async function handleProfileUpdate(event) {
        event.preventDefault();
        
        const updatedUserData = {
            nome: nameInput.value.trim(),
            email: emailInput.value.trim(),
        };

        const senhaAtual = currentPasswordInput.value;
        const novaSenha = newPasswordInput.value;
        const submitButton = profileForm.querySelector('button[type="submit"]');

       
        if (!updatedUserData.nome || !updatedUserData.email) {
            showNotification('Nome e e-mail são campos obrigatórios.', 'error');
            return;
        }

        if (!isValidEmail(updatedUserData.email)) {
            showNotification('Por favor, insira um formato de e-mail válido.', 'error');
            return;
        }

        if (novaSenha) { 
            if (!senhaAtual) {
                showNotification('Para alterar a senha, você precisa fornecer sua senha atual.', 'error');
                return;
            }

            const passwordValidation = validatePassword(novaSenha);
            if (!passwordValidation.isValid) {
                showNotification(passwordValidation.message, 'error');
                return;
            }
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            
            await apiUsuarioService.atualizar(currentUser.id, updatedUserData);
            
            
            if (novaSenha) {
                await apiAuthService.updatePassword(senhaAtual, novaSenha);
            }
            
            showNotification('Perfil atualizado com sucesso!', 'success');
            
            
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showNotification(`Falha na atualização: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    }
    
    inicializarPagina(); 
    profileForm.addEventListener('submit', handleProfileUpdate); 
});