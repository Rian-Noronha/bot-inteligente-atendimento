import { apiUsuarioService } from './services/apiUsuarioService.js';
import { apiPerfilService } from './services/apiPerfilService.js';
import { startSessionManagement } from './utils/sessionManager.js';

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
            const perfis = await apiPerfilService.pegarTodos();
            regTipoAcessoSelect.innerHTML = '<option value="" disabled selected>Selecione o Tipo de Acesso</option>';
            
            perfis.forEach(perfil => {
                const option = document.createElement('option');
                option.value = perfil.id;
                option.textContent = perfil.nome;
                regTipoAcessoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar perfis:", error);
            alert("Não foi possível carregar os tipos de acesso. A página será recarregada.");
            window.location.reload();
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
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'A cadastrar...';

        try {
            const novoUsuario = { nome, email, senha, perfil_id, ativo: true };
            await apiUsuarioService.criar(novoUsuario);

            alert('Usuário cadastrado com sucesso! A redirecionar para a lista de usuários.');
            window.location.href = './users.html'; 

        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            alert(`Erro ao cadastrar usuário: ${error.message}`);
        } finally {
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
