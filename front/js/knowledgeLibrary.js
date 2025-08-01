import { apiKnowledgeLibraryService } from './services/apiKnowledgeLibraryService.js';
import { apiPalavraChaveService } from './services/apiPalavraChaveService.js';
import { showNotification } from './utils/notifications.js';
import { inicializarUIComum } from './utils/uiComum.js';
import { ModalManager } from './utils/ModalManager.js';
import { PaginationManager } from './utils/PaginationManager.js'; 

document.addEventListener('DOMContentLoaded', () => {
    inicializarUIComum();

    const cardsContainer = document.getElementById('knowledge-library-cards-container');
    const noKnowledgeLibrarysMessage = document.getElementById('no-knowledge-librarys-message');
    const addKnowledgeLibraryButton = document.getElementById('add-knowledge-library-button');
    const confirmDeleteMessage = document.getElementById('confirm-delete-message');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    
    let documentIdToDelete = null;
    
    const paginationManager = new PaginationManager({
        paginationControls: document.getElementById('pagination-controls'),
        prevPageBtn: document.getElementById('prev-page-btn'),
        nextPageBtn: document.getElementById('next-page-btn'),
        pageInfoSpan: document.getElementById('page-info'),
        searchInput: document.getElementById('knowledge-library-search-input-header'),
        itemsPerPageInput: document.getElementById('num-documents-display'),
        onUpdate: fetchAndRenderDocuments,
        debounceDelay: 300,
    });

    const editModalManager = new ModalManager('edit-document-modal');
    const deleteModalManager = new ModalManager('confirm-delete-modal');

    async function fetchAndRenderDocuments() {
        try {
            noKnowledgeLibrarysMessage.textContent = 'A carregar documentos...';
            noKnowledgeLibrarysMessage.style.display = 'block';
            cardsContainer.style.display = 'none';

            const params = paginationManager.getApiParams();
            const apiResponse = await apiKnowledgeLibraryService.pegarTodos(params);

            renderDocuments(apiResponse.data);
            paginationManager.updateState(apiResponse.meta.totalPages);

        } catch (error) {
            console.error('Falha ao carregar documentos:', error);
            noKnowledgeLibrarysMessage.textContent = 'Falha ao carregar dados do servidor. Tente novamente mais tarde.';
            paginationManager.updateState(1);
        }
    }

    function renderDocuments(documents) {
        cardsContainer.innerHTML = '';
        
        if (!documents || documents.length === 0) {
            const message = paginationManager.getApiParams().search 
                ? 'Nenhum documento encontrado para sua busca.' 
                : 'Nenhum documento cadastrado.';
            noKnowledgeLibrarysMessage.textContent = message;
            noKnowledgeLibrarysMessage.style.display = 'block';
            cardsContainer.style.display = 'none';
        } else {
            noKnowledgeLibrarysMessage.style.display = 'none';
            cardsContainer.style.display = 'grid'; 
            
            documents.forEach(doc => {
                const card = document.createElement('div');
                card.className = 'document-card';
                const keywordsDisplay = doc.palavrasChave.map(p => p.palavra).join(', ');
                const anexoHtml = doc.urlArquivo 
                    ? `<a href="${doc.urlArquivo}" target="_blank" class="btn-anexo" title="Ver anexo"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg> Ver Arquivo</a>`
                    : '<span>Nenhum</span>';

                card.innerHTML = `
                    <div class="card-header"><h3>${doc.titulo}</h3></div>
                    <div class="card-body">
                        <p><strong>Tema:</strong> ${doc.subcategoria?.categoria?.nome || 'N/A'}</p>
                        <p><strong>Micro-tema:</strong> ${doc.subcategoria?.nome || 'N/A'}</p>
                        <p><strong>Descrição:</strong> ${doc.descricao || 'N/A'}</p>
                        <p><strong>Solução:</strong> ${doc.solucao || 'N/A'}</p>
                        <p><strong>Palavras-chave:</strong> ${keywordsDisplay || 'N/A'}</p>
                        <p class="card-anexo-line"><strong>Anexo:</strong> ${anexoHtml}</p>
                    </div>
                    <div class="card-footer user-actions">
                        <button class="btn-edit" data-id="${doc.id}" title="Editar documento"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                        <button class="btn-delete" data-id="${doc.id}" title="Excluir documento"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                    </div>
                `;
                cardsContainer.appendChild(card);
            });
        }
    }

    cardsContainer.addEventListener('click', (event) => {
        const editButton = event.target.closest('.btn-edit');
        if (editButton) {
            const docId = parseInt(editButton.dataset.id, 10);
            editModalManager.open(async (modalElement) => {
                try {
                    const doc = await apiKnowledgeLibraryService.pegarPorId(docId);
                    modalElement.querySelector('#edit-document-id').value = doc.id;
                    modalElement.querySelector('#edit-document-tema').value = doc.subcategoria?.categoria?.nome || 'N/A';
                    modalElement.querySelector('#edit-document-microtema').value = doc.subcategoria?.nome || 'N/A';
                    modalElement.querySelector('#edit-document-title').value = doc.titulo;
                    modalElement.querySelector('#edit-document-description').value = doc.descricao || '';
                    const solutionInput = modalElement.querySelector('#edit-document-solution');
                    solutionInput.value = doc.solucao || (doc.urlArquivo ? `Arquivo: ${doc.urlArquivo}` : '');
                    solutionInput.readOnly = !!doc.urlArquivo;
                    modalElement.querySelector('#edit-document-keywords').value = doc.palavrasChave.map(p => p.palavra).join(', ');
                } catch (error) {
                    showNotification(`Erro ao carregar dados do documento: ${error.message}`, 'error');
                    editModalManager.close();
                }
            });
            return;
        }

        const deleteButton = event.target.closest('.btn-delete');
        if (deleteButton) {
            documentIdToDelete = parseInt(deleteButton.dataset.id, 10);
            confirmDeleteMessage.textContent = 'Tem certeza de que deseja excluir este documento?';
            deleteModalManager.open();
        }
    });

    editModalManager.handleSubmit(async (form) => {
        const docId = parseInt(form.querySelector('#edit-document-id').value);
        const solutionInput = form.querySelector('#edit-document-solution');
        
        try {
            const keywordsString = form.querySelector('#edit-document-keywords').value.trim();
            let palavrasChaveIds = [];
            if (keywordsString) {
                const palavrasArray = keywordsString.split(',').map(p => p.trim()).filter(Boolean);
                if (palavrasArray.length > 0) {
                    palavrasChaveIds = (await apiPalavraChaveService.encontrarOuCriarLote(palavrasArray)).map(p => p.id);
                }
            }
            
            const updatedData = {
                titulo: form.querySelector('#edit-document-title').value.trim(),
                descricao: form.querySelector('#edit-document-description').value.trim(),
                solucao: solutionInput.readOnly ? undefined : solutionInput.value.trim(),
                palavrasChaveIds,
            };

            if (!updatedData.titulo || !updatedData.descricao || (!solutionInput.readOnly && !updatedData.solucao)) {
                showNotification('Título, Descrição e Solução são obrigatórios.', 'error');
                return;
            }

            await apiKnowledgeLibraryService.atualizar(docId, updatedData);
            showNotification('Documento atualizado com sucesso!', 'success');
            editModalManager.close();
            fetchAndRenderDocuments();
        } catch (error) {
            showNotification(`Erro ao atualizar o documento: ${error.message}`, 'error');
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
            deleteModalManager.close();
            documentIdToDelete = null;
        }
    });

    addKnowledgeLibraryButton.addEventListener('click', () => window.location.href = './upload.html');

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            editModalManager.close();
            deleteModalManager.close();
        }
    });

    fetchAndRenderDocuments(); 
});