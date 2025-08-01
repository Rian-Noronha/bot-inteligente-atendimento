import { apiUsuarioService } from './services/apiUsuarioService.js';
import { apiPerfilService } from './services/apiPerfilService.js';
import { isValidEmail } from './utils/validators.js';
import { showNotification } from './utils/notifications.js';
import { inicializarUIComum } from './utils/uiComum.js';
import { PaginationManager } from './utils/PaginationManager.js';
import { ModalManager } from './utils/ModalManager.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUIComum();

    const userSearchInput = document.getElementById('user-search-input');
    const numUsersDisplayInput = document.getElementById('num-users-display');
    const userCardsContainer = document.getElementById('user-cards-container');
    const noUsersMessage = document.getElementById('no-users-message');
    const addUserButton = document.getElementById('add-user-button');
    const paginationControlsContainer = document.getElementById('pagination-controls');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    let usersOnCurrentPage = [];
    let userIdToDelete = null;

    const paginationManager = new PaginationManager({
        paginationControls: paginationControlsContainer,
        prevPageBtn,
        nextPageBtn,
        pageInfoSpan,
        searchInput: userSearchInput,
        itemsPerPageInput: numUsersDisplayInput,
        onUpdate: fetchAndRenderUsers,
        debounceDelay: 300
    });

    const editUserModalManager = new ModalManager('edit-user-modal');
    const confirmDeleteModalManager = new ModalManager('confirm-delete-modal');

    async function fetchAndRenderUsers() {
        try {
            noUsersMessage.textContent = 'A carregar utilizadores...';
            noUsersMessage.style.display = 'block';
            userCardsContainer.style.display = 'none';

            const { page, limit, search } = paginationManager.getApiParams();
            const response = await apiUsuarioService.pegarPaginado(page, limit, search);
            
            usersOnCurrentPage = response.data;
            renderUserCards();

            paginationManager.updateState(response.meta.totalPages);
        } catch (error) {
            console.error('Falha ao carregar utilizadores:', error);
            noUsersMessage.textContent = 'Falha ao carregar dados do servidor.';
            noUsersMessage.style.display = 'block';
            userCardsContainer.innerHTML = '';
        }
    }

    function renderUserCards() {
        userCardsContainer.innerHTML = '';
        if (usersOnCurrentPage.length === 0) {
            noUsersMessage.textContent = userSearchInput.value.trim() ? 'Nenhum usuário encontrado para sua busca.' : 'Nenhum usuário cadastrado.';
            noUsersMessage.style.display = 'block';
            userCardsContainer.style.display = 'none';
        } else {
            noUsersMessage.style.display = 'none';
            userCardsContainer.style.display = 'grid';
            usersOnCurrentPage.forEach(user => {
                const card = document.createElement('div');
                card.className = 'user-card';
                const perfilNome = user.perfil ? user.perfil.nome : 'N/A';
                card.innerHTML = `
                    <div class="card-header"><h3>${user.nome}</h3><span class="user-role">${perfilNome}</span></div>
                    <div class="card-body"><p><strong>E-mail:</strong> ${user.email}</p></div>
                    <div class="card-footer user-actions">
                        <button class="btn-edit" data-id="${user.id}" title="Editar usuário"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                        <button class="btn-delete" data-id="${user.id}" title="Excluir usuário"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                    </div>`;
                userCardsContainer.appendChild(card);
            });
        }
    }

    editUserModalManager.handleSubmit(async (form) => {
        const userId = parseInt(form.querySelector('#edit-user-id').value);
        const updatedData = {
            nome: form.querySelector('#edit-user-name').value.trim(),
            email: form.querySelector('#edit-user-email').value.trim(),
            perfil_id: parseInt(form.querySelector('#edit-user-type').value)
        };

        if (!updatedData.nome || !updatedData.email) return showNotification('O nome e o e-mail são obrigatórios.', 'error');
        if (!isValidEmail(updatedData.email)) return showNotification('Por favor, insira um formato de e-mail válido.', 'error');

        try {
            await apiUsuarioService.atualizar(userId, updatedData);
            showNotification('Utilizador atualizado com sucesso!', 'success');
            editUserModalManager.close();
            await fetchAndRenderUsers();
        } catch (error) {
           showNotification(`Ocorreu um erro: ${error.message}`, 'error');
        }
    });

     userCardsContainer.addEventListener('click', (event) => {
        const targetButton = event.target.closest('button');
        if (!targetButton) return;
        
        const userId = parseInt(targetButton.dataset.id);
        const user = usersOnCurrentPage.find(u => u.id === userId);
        if (!user) return;

        if (targetButton.classList.contains('btn-edit')) {
            // A lógica de `openEditModal` agora vive dentro do callback de `open`
            editUserModalManager.open(async (modal) => {
                modal.querySelector('#edit-user-id').value = user.id;
                modal.querySelector('#edit-user-name').value = user.nome;
                modal.querySelector('#edit-user-email').value = user.email;
                const selectPerfis = modal.querySelector('#edit-user-type');
                selectPerfis.innerHTML = '<option value="">A carregar perfis...</option>'; // Estado de loading

                try {
                    const perfis = await apiPerfilService.pegarTodosPerfis();
                    selectPerfis.innerHTML = ''; // Limpa o select
                    perfis.forEach(perfil => {
                        const option = new Option(perfil.nome, perfil.id);
                        option.selected = (user.perfil_id === perfil.id);
                        selectPerfis.appendChild(option);
                    });
                } catch (error) {
                    console.error("Erro ao buscar perfis para o modal:", error);
                    selectPerfis.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
                }
            });
        } else if (targetButton.classList.contains('btn-delete')) {
            userIdToDelete = user.id;
            confirmDeleteModalManager.open((modal) => {
                modal.querySelector('#confirm-delete-message').textContent = `Tem certeza que deseja excluir o usuário "${user.nome}"?`;
            });
        }
    });

    btnConfirmDelete.addEventListener('click', async () => {
        if (userIdToDelete === null) return;

        try {
            await apiUsuarioService.deletar(userIdToDelete);
            showNotification('Utilizador excluído com sucesso!', 'success');
            fetchAndRenderUsers();
        } catch (error) {
            showNotification(`Ocorreu um erro: ${error.message}`, 'error');
        } finally {
            confirmDeleteModalManager.close();
            userIdToDelete = null;
        }
    });

    if (addUserButton) {
        addUserButton.addEventListener('click', () => {
            window.location.href = './register.html';
        });
    }

    fetchAndRenderUsers();
});