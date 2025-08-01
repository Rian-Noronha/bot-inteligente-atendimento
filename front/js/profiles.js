import { apiPerfilService } from './services/apiPerfilService.js';
import { showNotification } from './utils/notifications.js';
import { inicializarUIComum } from './utils/uiComum.js';
import { PaginationManager } from './utils/PaginationManager.js';
import { ModalManager } from './utils/ModalManager.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUIComum();

    const searchInput = document.getElementById('profile-search-input');
    const numProfilesDisplayInput = document.getElementById('num-profiles-display');
    const cardsContainer = document.getElementById('profiles-cards-container');
    const noProfilesMessage = document.getElementById('no-profiles-message');
    const addProfileButton = document.getElementById('add-profile-button');
    const paginationControlsContainer = document.getElementById('pagination-controls');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    let profilesOnCurrentPage = [];
    let profileIdToDelete = null;

    const paginationManager = new PaginationManager({
        paginationControls: paginationControlsContainer,
        prevPageBtn,
        nextPageBtn,
        pageInfoSpan,
        searchInput,
        itemsPerPageInput: numProfilesDisplayInput,
        onUpdate: fetchAndRenderProfiles,
        debounceDelay: 300 
    });

    const editModalManager = new ModalManager('edit-profile-modal');
    const confirmDeleteModalManager = new ModalManager('confirm-delete-modal');

    async function fetchAndRenderProfiles() {
        try {
            noProfilesMessage.textContent = 'A carregar perfis...';
            noProfilesMessage.style.display = 'block';
            cardsContainer.style.display = 'none';

            const { page, limit, search } = paginationManager.getApiParams();
            const response = await apiPerfilService.pegarPaginado(page, limit, search);
            
            profilesOnCurrentPage = response.data;
            renderProfileCards();

            paginationManager.updateState(response.meta.totalPages);
        } catch (error) {
            console.error('Falha ao carregar perfis:', error);
            noProfilesMessage.textContent = 'Falha ao carregar dados do servidor.';
            noProfilesMessage.style.display = 'block';
            cardsContainer.innerHTML = '';
        }
    }

    function renderProfileCards() {
        cardsContainer.innerHTML = '';
        if (profilesOnCurrentPage.length === 0) {
            noProfilesMessage.textContent = searchInput.value.trim() ? 'Nenhum perfil encontrado para sua busca.' : 'Nenhum perfil cadastrado.';
            noProfilesMessage.style.display = 'block';
            cardsContainer.style.display = 'none';
        } else {
            noProfilesMessage.style.display = 'none';
            cardsContainer.style.display = 'grid';
            profilesOnCurrentPage.forEach(perfil => {
                const card = document.createElement('div');
                card.className = 'profile-card';
                card.innerHTML = `
                    <div class="card-header"><h3>${perfil.nome}</h3></div>
                    <div class="card-body"><p>${perfil.descricao || '<em>Sem descrição.</em>'}</p></div>
                    <div class="card-footer user-actions">
                        <button class="btn-edit" data-id="${perfil.id}" title="Editar perfil"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                        <button class="btn-delete" data-id="${perfil.id}" title="Excluir perfil"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                    </div>`;
                cardsContainer.appendChild(card);
            });
        }
    }

    editModalManager.handleSubmit(async (form) => {
        const id = form.querySelector('#edit-profile-id').value;
        const dados = {
            nome: form.querySelector('#edit-profile-nome').value.trim(),
            descricao: form.querySelector('#edit-profile-descricao').value.trim()
        };

        if (!dados.nome || !dados.descricao) {
            showNotification('Nome e descrição são obrigatórios.', 'error');
            return;
        }

        try {
            const serviceCall = id ? apiPerfilService.atualizar(id, dados) : apiPerfilService.criar(dados);
            await serviceCall;
            showNotification(id ? 'Perfil atualizado!' : 'Perfil criado!', 'success');
            editModalManager.close();
            fetchAndRenderProfiles();
        } catch (error) {
            showNotification(`Erro ao salvar perfil: ${error.message}`, 'error');
        }
    });

    addProfileButton.addEventListener('click', () => {
        editModalManager.open(modal => {
            modal.querySelector('h2').textContent = 'Adicionar Novo Perfil';
        });
    });
    
    cardsContainer.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        const perfil = profilesOnCurrentPage.find(p => p.id == id);

        if (target.classList.contains('btn-edit')) {
            editModalManager.open(modal => {
                modal.querySelector('h2').textContent = 'Editar Perfil';
                modal.querySelector('#edit-profile-id').value = perfil.id;
                modal.querySelector('#edit-profile-nome').value = perfil.nome;
                modal.querySelector('#edit-profile-descricao').value = perfil.descricao || '';
            });
        } else if (target.classList.contains('btn-delete')) {
            profileIdToDelete = perfil.id;
            confirmDeleteModalManager.open(modal => {
                modal.querySelector('#confirm-delete-message').textContent = `Tem certeza que deseja excluir o perfil "${perfil?.nome}"?`;
            });
        }
    });

    btnConfirmDelete.addEventListener('click', async () => {
        if (profileIdToDelete === null) return;

        try {
            await apiPerfilService.deletar(profileIdToDelete);
            showNotification('Perfil excluído com sucesso!', 'success');
            fetchAndRenderProfiles();
        } catch (error) {
            showNotification(`Erro ao excluir perfil: ${error.message}`, 'error');
        } finally {
            confirmDeleteModalManager.close();
            profileIdToDelete = null;
        }
    });

    fetchAndRenderProfiles();
});