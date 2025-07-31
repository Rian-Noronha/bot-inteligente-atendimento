import { apiUsuarioService } from './services/apiUsuarioService.js';
import { apiPerfilService } from './services/apiPerfilService.js';
import { startSessionManagement } from './utils/sessionManager.js';
import { isValidEmail, validatePassword } from './utils/validators.js';
import { showNotification } from './utils/notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
    startSessionManagement();

    const registerForm = document.getElementById('register-form'); // Assumindo que o form tem este ID
    const regNomeInput = document.getElementById('reg-nome');
    const regEmailInput = document.getElementById('reg-email');
    const regSenhaInput = document.getElementById('reg-senha');
    const regTipoAcessoSelect = document.getElementById('reg-tipo-acesso');
    const btnCadastrar = document.getElementById('btn-cadastrar');
    const backButton = document.querySelector('.back-button');

    /**
     * Carrega os perfis disponíveis da API e os popula no campo de seleção.
     */
    async function carregarPerfis() {
        try {
            const perfis = await apiPerfilService.pegarTodosPerfis();
            regTipoAcessoSelect.innerHTML = '<option value="" disabled selected>Selecione o Tipo de Acesso</option>';
            
            perfis.forEach(perfil => {
                const option = document.createElement('option');
                option.value = perfil.id;
                option.textContent = perfil.nome;
                regTipoAcessoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar perfis:", error);
            showNotification("Falha ao carregar perfis. A página será recarregada.", 'error');
            setTimeout(() => window.location.reload(), 3000);
        }
    }

    /**
     * Lida com o envio do formulário de cadastro.
     */
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = regNomeInput.value.trim();
        const email = regEmailInput.value.trim();
        const senha = regSenhaInput.value.trim();
        const perfil_id = parseInt(regTipoAcessoSelect.value, 10);

        if (!nome || !email || !senha || isNaN(perfil_id)) {
            showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Por favor, insira um formato de e-mail válido.', 'error');
            return;
        }

        const passwordValidation = validatePassword(senha);
        if (!passwordValidation.isValid) {
            showNotification(passwordValidation.message, 'error');
            return;
        }

        
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'A cadastrar...';

        try {
            const novoUsuario = { nome, email, senha, perfil_id, ativo: true };
            await apiUsuarioService.criar(novoUsuario);

            showNotification('Usuário cadastrado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = './users.html'; 
            }, 2000);

        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            showNotification(`Erro ao cadastrar usuário: ${error.message}`, 'error');
            btnCadastrar.disabled = false;
            btnCadastrar.textContent = 'Cadastrar Usuário';
        } 
    });

    // Listener para o botão de voltar
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = './users.html';
        });
    }

    
    await carregarPerfis();
});
