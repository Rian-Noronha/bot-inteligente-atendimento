import { apiKnowledgeLibraryService } from './services/apiKnowledgeLibraryService.js';
import { apiPalavraChaveService } from './services/apiPalavraChaveService.js';
import { apiAuthService } from './services/apiAuthService.js';
import { startSessionManagement } from './utils/sessionManager.js';
import { showNotification } from './utils/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    startSessionManagement();

   
    const hamburger = document.getElementById('hamburger');
    const aside = document.querySelector('aside');
    const searchInput = document.getElementById('knowledge-library-search-input-header');
    const numDocumentsDisplayInput = document.getElementById('num-documents-display');
    const cardsContainer = document.getElementById('knowledge-library-cards-container');
    
    const noKnowledgeLibrarysMessage = document.getElementById('no-knowledge-librarys-message');
    const addKnowledgeLibraryButton = document.getElementById('add-knowledge-library-button');
    const logoutButton = document.getElementById('logout-btn');

   
    const editModal = document.getElementById('edit-document-modal');
    const editForm = document.getElementById('edit-document-form');
    const editDocumentId = document.getElementById('edit-document-id');
    const editDocumentTema = document.getElementById('edit-document-tema');
    const editDocumentMicrotema = document.getElementById('edit-document-microtema');
    const editDocumentTitle = document.getElementById('edit-document-title');
    const editDocumentDescription = document.getElementById('edit-document-description');
    const editDocumentSolution = document.getElementById('edit-document-solution');
    const editDocumentKeywords = document.getElementById('edit-document-keywords');
    const btnCancelDocument = editModal.querySelector('.btn-cancel');

    
    const paginationControls = document.getElementById('pagination-controls');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');

    
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteMessage = document.getElementById('confirm-delete-message');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');


    
    let currentPage = 1;
    let totalPages = 1;
    let currentSearchTerm = '';
    let itemsPerPage = 5;
    let documentIdToDelete = null;

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
                console.error('Erro ao encerrar sessão no servidor:', error);
            } finally {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';
            }
        });
    }



    // Função Debounce, espera o usuário parar de digitar por 300ms antes de fazer uma nova chamada à API 
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Busca os dados da API com base no estado atual e renderiza.
     */
    async function fetchAndRenderDocuments() {
        try {
            noKnowledgeLibrarysMessage.textContent = 'A carregar documentos...';
            noKnowledgeLibrarysMessage.style.display = 'block';
            
            //Esconde o contêiner de cards enquanto carrega
            cardsContainer.style.display = 'none';
            paginationControls.style.display = 'none';

            itemsPerPage = parseInt(numDocumentsDisplayInput.value) || 5;

            const apiResponse = await apiKnowledgeLibraryService.pegarTodos({
                page: currentPage,
                limit: itemsPerPage,
                search: currentSearchTerm
            });

            totalPages = apiResponse.totalPages || 1;
            renderDocuments(apiResponse.documentos);
            updatePaginationControls();

        } catch (error) {
            console.error('Falha ao carregar documentos:', error);
            noKnowledgeLibrarysMessage.textContent = 'Falha ao carregar dados do servidor. Tente novamente mais tarde.';
        }
    }

    /**
     * Renderiza os CARDS 
     */
    function renderDocuments(documents) {
        cardsContainer.innerHTML = '';
        
        if (!documents || documents.length === 0) {
            const message = currentSearchTerm ? 'Nenhum documento encontrado para sua busca.' : 'Nenhum documento cadastrado.';
            noKnowledgeLibrarysMessage.textContent = message;
            noKnowledgeLibrarysMessage.style.display = 'block';
            cardsContainer.style.display = 'none';
            paginationControls.style.display = 'none';
        } else {
            noKnowledgeLibrarysMessage.style.display = 'none';
            // Define o display como 'grid' para ativar o CSS responsivo
            cardsContainer.style.display = 'grid'; 
            paginationControls.style.display = 'flex';
            
            documents.forEach(doc => {
                const card = document.createElement('div');
                card.className = 'document-card'; // Classe para estilização do card

                const keywordsDisplay = doc.palavrasChave.map(p => p.palavra).join(', ');
                const anexoHtml = doc.urlArquivo 
                    ? `<a href="${doc.urlArquivo}" target="_blank" class="btn-anexo" title="Ver anexo">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>
                        Ver Arquivo
                       </a>`
                    : '<span>Nenhum</span>';

                card.innerHTML = `
                    <div class="card-header">
                        <h3>${doc.titulo}</h3>
                    </div>
                    <div class="card-body">
                        <p><strong>Tema:</strong> ${doc.subcategoria?.categoria?.nome || 'N/A'}</p>
                        <p><strong>Micro-tema:</strong> ${doc.subcategoria?.nome || 'N/A'}</p>
                        <p><strong>Descrição:</strong> ${doc.descricao || 'N/A'}</p>
                        <p><strong>Solução:</strong> ${doc.solucao || 'N/A'}</p>
                        <p><strong>Palavras-chave:</strong> ${keywordsDisplay || 'N/A'}</p>
                        <p class="card-anexo-line"><strong>Anexo:</strong> ${anexoHtml}</p>
                    </div>
                    <div class="card-footer user-actions">
                        <button class="btn-edit" data-id="${doc.id}" title="Editar documento">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                        </button>
                        <button class="btn-delete" data-id="${doc.id}" title="Excluir documento">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                        </button>
                    </div>
                `;
                cardsContainer.appendChild(card);
            });
        }
    }

    // Funções de controle de paginação e modal 
    function updatePaginationControls() {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    async function openEditModal(docId) {
        try {
            const doc = await apiKnowledgeLibraryService.pegarPorId(docId);
            if (!doc) {
                showNotification('Documento não encontrado.', 'error');
                return;
            }
            editDocumentId.value = doc.id;
            editDocumentTema.value = doc.subcategoria?.categoria?.nome || 'N/A';
            editDocumentMicrotema.value = doc.subcategoria?.nome || 'N/A';
            editDocumentTitle.value = doc.titulo;
            editDocumentDescription.value = doc.descricao || '';
            editDocumentSolution.value = doc.solucao || (doc.urlArquivo ? `Arquivo: ${doc.urlArquivo}` : '');
            editDocumentSolution.readOnly = !!doc.urlArquivo;
            editDocumentKeywords.value = doc.palavrasChave.map(p => p.palavra).join(', ');
            editModal.style.display = 'flex';
            setTimeout(() => editModal.classList.add('active'), 10);
        } catch (error) {
            showNotification(`Erro ao carregar dados do documento: ${error.message}`, 'error');
        }
    }
    
    function closeEditModal() {
        editModal.classList.remove('active');
        setTimeout(() => {
            editModal.style.display = 'none';
        }, 300);
    }
    
    
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const docId = parseInt(editDocumentId.value);
        try {
            const keywordsString = editDocumentKeywords.value.trim();
            let palavrasChaveIds = [];
            if (keywordsString) {
                const palavrasArray = keywordsString.split(',').map(p => p.trim()).filter(Boolean);
                if(palavrasArray.length > 0) {
                    const palavrasChaveSalvas = await apiPalavraChaveService.encontrarOuCriarLote(palavrasArray);
                    palavrasChaveIds = palavrasChaveSalvas.map(p => p.id);
                }
            }
            const updatedData = {
                titulo: editDocumentTitle.value.trim(),
                descricao: editDocumentDescription.value.trim(),
                solucao: editDocumentSolution.readOnly ? undefined : editDocumentSolution.value.trim(),
                palavrasChaveIds: palavrasChaveIds,
            };

               
            if (!updatedData.titulo) {
                showNotification('O título do documento é obrigatório.', 'error');
                return;
            }
            if (!updatedData.descricao) {
                showNotification('A descrição do documento é obrigatória.', 'error');
                return;
            }
           
            if (!editDocumentSolution.readOnly && !updatedData.solucao) {
                showNotification('A solução do documento é obrigatória.', 'error');
                return;
            }

            await apiKnowledgeLibraryService.atualizar(docId, updatedData);
            showNotification('Documento atualizado com sucesso!', 'success');
            closeEditModal();
            fetchAndRenderDocuments();
        } catch (error) {
            showNotification(`Erro ao atualizar o documento: ${error.message}`, 'error');
        }
    });

    // event listener do contêiner de cards
    cardsContainer.addEventListener('click', (event) => {
        const editButton = event.target.closest('.btn-edit');
        if (editButton) {
            openEditModal(parseInt(editButton.dataset.id, 10));
            return;
        }

         const deleteButton = event.target.closest('.btn-delete');
        if (deleteButton) {
            documentIdToDelete = parseInt(deleteButton.dataset.id, 10);
            confirmDeleteMessage.textContent = 'Tem certeza de que deseja excluir este documento?';
            confirmDeleteModal.style.display = 'flex';
        }
    });

    btnConfirmDelete.addEventListener('click', async () => {
        if (documentIdToDelete === null) return;

        try {
            await apiKnowledgeLibraryService.deletar(documentIdToDelete);
            showNotification('Documento excluído com sucesso!', 'success');
            fetchAndRenderDocuments(); 
        } catch (error) {
            showNotification(`Erro ao excluir o documento: ${error.message}`, 'error');
        } finally {
            confirmDeleteModal.style.display = 'none';
            documentIdToDelete = null;
        }
    });

    btnCancelDelete.addEventListener('click', () => {
        confirmDeleteModal.style.display = 'none';
        documentIdToDelete = null;
    });

    // Event listeners dos controles 
    addKnowledgeLibraryButton.addEventListener('click', () => window.location.href = './upload.html');
    btnCancelDocument.addEventListener('click', closeEditModal);

    searchInput.addEventListener('input', debounce(() => {
        currentSearchTerm = searchInput.value.trim();
        currentPage = 1;
        fetchAndRenderDocuments(); 
    }, 300));

    numDocumentsDisplayInput.addEventListener('input', () => {
        currentPage = 1;
        fetchAndRenderDocuments(); 
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndRenderDocuments();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchAndRenderDocuments();
        }
    });

    editModal.addEventListener('click', (event) => { if (event.target === editModal) closeEditModal(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeEditModal(); });


    fetchAndRenderDocuments();
});