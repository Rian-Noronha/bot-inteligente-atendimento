import { apiUsuarioService } from './services/apiUsuarioService.js';
import { apiPerfilService } from './services/apiPerfilService.js';
import { apiAuthService } from './services/apiAuthService.js';
import { startSessionManagement } from './utils/sessionManager.js';

document.addEventListener('DOMContentLoaded', () => {
    
    startSessionManagement();


    const hamburger = document.getElementById('hamburger');
    const aside = document.querySelector('aside');
    const userSearchInput = document.getElementById('user-search-input');
    const numUsersDisplayInput = document.getElementById('num-users-display');
    const userCardsContainer = document.getElementById('user-cards-container');
    const noUsersMessage = document.getElementById('no-users-message');
    const addUserButton = document.getElementById('add-user-button');
    const logoutButton = document.getElementById('logout-btn');

    
    const editUserModal = document.getElementById('edit-user-modal');
    const editUserForm = document.getElementById('edit-user-form');
    const editUserId = document.getElementById('edit-user-id');
    const editUserName = document.getElementById('edit-user-name');
    const editUserEmail = document.getElementById('edit-user-email');
    const editUserType = document.getElementById('edit-user-type');
    const btnCancel = editUserModal.querySelector('.btn-cancel');

    
    let allUsers = [];

    

    
    if (hamburger && aside) {
        hamburger.addEventListener('click', () => aside.classList.toggle('open'));
        document.addEventListener('click', (event) => {
            if (aside.classList.contains('open') && !aside.contains(event.target) && !hamburger.contains(event.target)) {
                aside.classList.remove('open');
            }
        });
    }

    
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                await apiAuthService.logout();
            } catch (error) {
                console.error("Erro ao notificar o servidor sobre o logout:", error);
            } finally {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';
            }
        });
    }

    /**
     * Busca e renderiza os usuários.
     */
    async function fetchAndRenderUsers() {
        try {
            noUsersMessage.textContent = 'A carregar utilizadores...';
            noUsersMessage.style.display = 'block';
            userCardsContainer.style.display = 'none';

            const usersFromAPI = await apiUsuarioService.pegarTodos();
            allUsers = usersFromAPI;
            renderUsers();
        } catch (error) {
            console.error('Falha ao carregar utilizadores:', error);
            noUsersMessage.textContent = 'Falha ao carregar dados do servidor. Tente novamente mais tarde.';
        }
    }

    /**
     * Renderiza os cards com base nos dados filtrados.
     */
    function renderUsers() {
        userCardsContainer.innerHTML = '';
        let filteredUsers = [...allUsers];

        const searchTerm = userSearchInput ? userSearchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user =>
                user.nome.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );
        }

        const numToDisplay = parseInt(numUsersDisplayInput.value);
        if (!isNaN(numToDisplay) && numToDisplay > 0) {
            filteredUsers = filteredUsers.slice(0, numToDisplay);
        }

        if (filteredUsers.length === 0) {
            noUsersMessage.textContent = 'Nenhum usuário encontrado.';
            noUsersMessage.style.display = 'block';
            userCardsContainer.style.display = 'none';
        } else {
            noUsersMessage.style.display = 'none';
            userCardsContainer.style.display = 'grid'; // Ativa o layout de grid
            
            filteredUsers.forEach(user => {
                const card = document.createElement('div');
                card.className = 'user-card'; // Classe para estilizar o card
                const perfilNome = user.perfil ? user.perfil.nome : 'N/A';

                card.innerHTML = `
                    <div class="card-header">
                        <h3>${user.nome}</h3>
                        <span class="user-role">${perfilNome}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>E-mail:</strong> ${user.email}</p>
                    </div>
                    <div class="card-footer user-actions">
                        <button class="btn-edit" data-id="${user.id}" title="Editar usuário">
                           <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                        </button>
                        <button class="btn-delete" data-id="${user.id}" title="Excluir usuário">
                           <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                        </button>
                    </div>
                `;
                userCardsContainer.appendChild(card);
            });
        }
    }

    /**
     * Abre e preenche o modal de edição.
     */
    async function openEditModal(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            editUserId.value = user.id;
            editUserName.value = user.nome;
            editUserEmail.value = user.email;

            try {
                const perfis = await apiPerfilService.pegarTodos();
                editUserType.innerHTML = '<option value="" disabled>A carregar Perfis...</option>';
                
                perfis.forEach(perfil => {
                    const option = document.createElement('option');
                    option.value = perfil.id;
                    option.textContent = perfil.nome;
                    if (user.perfil_id === perfil.id) {
                        option.selected = true;
                    }
                    editUserType.appendChild(option);
                });
            } catch (error) {
                console.error("Erro ao buscar perfis para o modal:", error);
                editUserType.innerHTML = '<option value="" disabled selected>Erro ao carregar perfis</option>';
            }

            editUserModal.style.display = 'flex';
        }
    }

    function closeEditModal() {
        editUserModal.style.display = 'none';
        editUserForm.reset();
    }

    // Lida com a submissão do formulário de edição
    editUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const userId = parseInt(editUserId.value);
        const selectedPerfilId = parseInt(editUserType.value);

        const updatedData = {
            nome: editUserName.value.trim(),
            email: editUserEmail.value.trim(),
            perfil_id: selectedPerfilId
        };

        if (!updatedData.nome || !updatedData.email || isNaN(selectedPerfilId)) {
            alert('Todos os campos são obrigatórios.');
            return;
        }

        try {
            await apiUsuarioService.atualizar(userId, updatedData);
            alert('Utilizador atualizado com sucesso!');
            closeEditModal();
            fetchAndRenderUsers();
        } catch (error) {
            console.error(error);
            alert(`Ocorreu um erro ao atualizar o utilizador: ${error.message}`);
        }
    });

    // Lida com os cliques nos cards para editar ou deletar
    userCardsContainer.addEventListener('click', async (event) => {
        const targetButton = event.target.closest('button');
        if (!targetButton) return;

        const userId = parseInt(targetButton.dataset.id);
        if (isNaN(userId)) return;

        if (targetButton.classList.contains('btn-edit')) {
            openEditModal(userId);
        } else if (targetButton.classList.contains('btn-delete')) {
            const user = allUsers.find(u => u.id === userId);
            if (confirm(`Tem certeza que deseja excluir o usuário "${user?.nome}"?`)) {
                try {
                    await apiUsuarioService.deletar(userId);
                    alert('Utilizador excluído com sucesso!');
                    fetchAndRenderUsers();
                } catch (error) {
                    console.error(error);
                    alert(`Ocorreu um erro ao excluir o utilizador: ${error.message}`);
                }
            }
        }
    });

    if (addUserButton) {
        addUserButton.addEventListener('click', () => {
            window.location.href = './register.html';
        });
    }
    btnCancel.addEventListener('click', closeEditModal);
    if (userSearchInput) userSearchInput.addEventListener('input', renderUsers);
    if (numUsersDisplayInput) numUsersDisplayInput.addEventListener('input', renderUsers);

    fetchAndRenderUsers(); //aplicar paginação para não pegar tudo de uma vez
});
