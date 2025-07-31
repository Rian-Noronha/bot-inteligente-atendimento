import { apiPerfilService } from './services/apiPerfilService.js';
import { showNotification } from './utils/notifications.js';
import { inicializarUIComum } from './utils/uiComum.js';

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

    
    const editModal = document.getElementById('edit-profile-modal');
    const editForm = document.getElementById('edit-profile-form');
    const modalTitle = editModal.querySelector('h2');
    const editProfileId = document.getElementById('edit-profile-id');
    const editProfileNome = document.getElementById('edit-profile-nome');
    const editProfileDescricao = document.getElementById('edit-profile-descricao');
    const btnCancel = editModal.querySelector('.btn-cancel');

    
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteMessage = document.getElementById('confirm-delete-message');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    
    let profilesOnCurrentPage = [];
    let currentPage = 1;
    let totalPages = 1;

    let profileIdToDelete = null;

    async function fetchAndRenderProfiles() {
        try {
            noProfilesMessage.textContent = 'A carregar perfis...';
            noProfilesMessage.style.display = 'block';
            cardsContainer.style.display = 'none';
            paginationControlsContainer.style.display = 'none';
            const searchTerm = searchInput.value.trim();
            const itemsPerPage = parseInt(numProfilesDisplayInput.value) || 10;
            const response = await apiPerfilService.pegarPaginado(currentPage, itemsPerPage, searchTerm);
            profilesOnCurrentPage = response.data;
            totalPages = response.meta.totalPages;
            renderProfileCards();
            renderPaginationControls();
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


    function renderPaginationControls() {
        if (totalPages <= 1) {
            paginationControlsContainer.style.display = 'none';
            return;
        }
        paginationControlsContainer.style.display = 'flex';
        pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }


    function openEditModal(perfil = null) {
        editForm.reset();
        if (perfil) {
            modalTitle.textContent = 'Editar Perfil';
            editProfileId.value = perfil.id;
            editProfileNome.value = perfil.nome;
            editProfileDescricao.value = perfil.descricao || '';
        } else {
            modalTitle.textContent = 'Adicionar Novo Perfil';
            editProfileId.value = '';
        }
        editModal.style.display = 'flex';
    }

    function closeEditModal() {
        editModal.style.display = 'none';
    }

    searchInput.addEventListener('input', () => { currentPage = 1; fetchAndRenderProfiles(); });
    numProfilesDisplayInput.addEventListener('input', () => { currentPage = 1; fetchAndRenderProfiles(); });
    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; fetchAndRenderProfiles(); } });
    nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; fetchAndRenderProfiles(); } });

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = editProfileId.value;
        const dados = {
            nome: editProfileNome.value.trim(),
            descricao: editProfileDescricao.value.trim()
        };

        if (!dados.nome) {
            showNotification('O nome do perfil é obrigatório.', 'error');
            return;
        }

        if (!dados.descricao) {
            showNotification('Descrição é obrigatório.', 'error');
            return;
        }

        try {
            if (id) {
                await apiPerfilService.atualizar(id, dados);
                showNotification('Perfil atualizado com sucesso!', 'success');
            } else {
                await apiPerfilService.criar(dados);
                showNotification('Perfil criado com sucesso!', 'success');
            }
            closeEditModal();
            fetchAndRenderProfiles();
        } catch (error) {
            showNotification(`Erro ao salvar perfil: ${error.message}`, 'error');
        }
    });
    
    cardsContainer.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;

        if (target.classList.contains('btn-edit')) {
            const perfil = profilesOnCurrentPage.find(p => p.id == id);
            openEditModal(perfil);
        } else if (target.classList.contains('btn-delete')) {
            const perfil = profilesOnCurrentPage.find(p => p.id == id);
            profileIdToDelete = perfil.id;
            confirmDeleteMessage.textContent = `Tem certeza que deseja excluir o perfil "${perfil?.nome}"?`;
            confirmDeleteModal.style.display = 'flex';
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
            confirmDeleteModal.style.display = 'none';
            profileIdToDelete = null;
        }
    });

    btnCancelDelete.addEventListener('click', () => {
        confirmDeleteModal.style.display = 'none';
        profileIdToDelete = null;
    });

    addProfileButton.addEventListener('click', () => openEditModal());
    btnCancel.addEventListener('click', closeEditModal);
    
    fetchAndRenderProfiles();
});