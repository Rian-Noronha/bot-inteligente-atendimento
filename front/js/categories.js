import { apiCategoriaService } from './services/apiCategoriaService.js';
import { apiSubcategoriaService } from './services/apiSubcategoriaService.js';
import { showNotification } from './utils/notifications.js';
import { inicializarUIComum } from './utils/uiComum.js';
import { PaginationManager } from './utils/PaginationManager.js';
import { ModalManager } from './utils/ModalManager.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUIComum();

    
    const searchInput = document.getElementById('category-search-input');
    const numDisplayInput = document.getElementById('num-categories-display');
    const categoryContainer = document.getElementById('category-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const addCategoryBtn = document.getElementById('add-category-button');
    const paginationControlsContainer = document.getElementById('pagination-controls');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');
    
    
    let categoriesOnCurrentPage = [];
    let itemToDelete = null;
    const paginationManager = new PaginationManager({
        paginationControls: paginationControlsContainer, 
        prevPageBtn, 
        nextPageBtn, 
        pageInfoSpan,
        searchInput, 
        itemsPerPageInput: numDisplayInput, 
        onUpdate: fetchAndRenderCategories,
        debounceDelay: 300 
    });
    
    const categoryModal = new ModalManager('category-modal');
    const subcategoryModal = new ModalManager('subcategory-modal');
    const confirmDeleteModal = new ModalManager('confirm-delete-modal');

    
    async function fetchAndRenderCategories() {
        loadingMessage.style.display = 'block';
        categoryContainer.innerHTML = '';
        try {
            const { page, limit, search } = paginationManager.getApiParams();
            const response = await apiCategoriaService.pegarPaginada(page, limit, search);
            categoriesOnCurrentPage = response.data;
            renderCategories(categoriesOnCurrentPage);
            paginationManager.updateState(response.meta.totalPages);
        } catch (error) {
            categoryContainer.innerHTML = `<p class="error text-center p-4">Falha ao carregar categorias: ${error.message}</p>`;
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    const renderCategories = (categories) => {
        categoryContainer.innerHTML = '';
        if (categories.length === 0) {
            categoryContainer.innerHTML = '<p class="text-center p-4">Nenhuma categoria encontrada.</p>';
            return;
        }
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'accordion-item';
            categoryElement.dataset.categoryId = category.id;
            categoryElement.innerHTML = `
                <div class="accordion-header">
                    <span class="accordion-title">${category.nome}</span>
                    <div class="accordion-actions">
                        <button class="btn-action btn-add-subcategory" title="Adicionar Subcategoria"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg></button>
                        <button class="btn-action btn-edit-category" title="Editar Categoria"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                        <button class="btn-action btn-delete-category" title="Excluir Categoria"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                        <button class="btn-action btn-toggle" title="Expandir/Recolher"><svg class="toggle-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="m240-400-80-80 200-200 200 200-80 80-120-120-120 120Z"/></svg></button>
                    </div>
                </div>
                <div class="accordion-content" style="display: none;">
                    <ul class="subcategory-list"></ul>
                    <p class="content-loading" style="display: none;">Carregando subcategorias...</p>
                </div>`;
            categoryContainer.appendChild(categoryElement);
        });
    };
        
    const renderSubcategories = (listElement, subcategories) => {
        listElement.innerHTML = '';
        if (subcategories.length === 0) {
            listElement.innerHTML = '<li class="empty-subcategory">Nenhuma subcategoria cadastrada.</li>';
            return;
        }
        subcategories.forEach(sub => {
            const subElement = document.createElement('li');
            subElement.dataset.subcategoryId = sub.id;
            subElement.dataset.subcategoryName = sub.nome;
            subElement.dataset.subcategoryDescription = sub.descricao || '';
            subElement.innerHTML = `
                <span>${sub.nome}</span>
                <div class="subcategory-actions">
                    <button class="btn-action btn-edit-subcategory" title="Editar Subcategoria"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                    <button class="btn-action btn-delete-subcategory" title="Excluir Subcategoria"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                </div>`;
            listElement.appendChild(subElement);
        });
    };

    
    async function handleToggleAccordion(accordionItem) {
        const content = accordionItem.querySelector('.accordion-content');
        const list = content.querySelector('.subcategory-list');
        const isLoading = content.querySelector('.content-loading');
        const icon = accordionItem.querySelector('.toggle-icon');
        const isOpening = content.style.display === 'none';
        
        content.style.display = isOpening ? 'block' : 'none';
        icon?.classList.toggle('rotated', isOpening);

        if (isOpening && list.dataset.loaded !== 'true') {
            isLoading.style.display = 'block';
            try {
                const categoryId = accordionItem.dataset.categoryId;
                const subcategories = await apiSubcategoriaService.pegarPorCategoriaId(categoryId);
                renderSubcategories(list, subcategories);
                list.dataset.loaded = 'true';
            } catch (error) {
                list.innerHTML = `<li class="error">Erro ao carregar.</li>`;
            } finally {
                isLoading.style.display = 'none';
            }
        }
    }

    
    addCategoryBtn.addEventListener('click', () => {
        categoryModal.open(modal => {
            modal.querySelector('#category-modal-title').textContent = 'Nova Categoria';
        });
    });

    categoryModal.handleSubmit(async (form) => {
        const id = form.querySelector('#category-id').value;
        const nome = form.querySelector('#category-name').value.trim();
        const descricao = form.querySelector('#category-description').value.trim();

        if (!nome) {
            showNotification('O nome da categoria é obrigatório.', 'error');
            return;
        }

        try {
            const data = { nome, descricao };
            const message = id ? 'Categoria atualizada!' : 'Categoria criada!';
            await (id ? apiCategoriaService.atualizar(id, data) : apiCategoriaService.criar(data));
            showNotification(message, 'success');
            categoryModal.close();
            fetchAndRenderCategories();
        } catch (error) {
            showNotification('Erro ao salvar categoria: ' + error.message, 'error');
        }
    });

    subcategoryModal.handleSubmit(async (form) => {
        const id = form.querySelector('#subcategory-id').value;
        const nome = form.querySelector('#subcategory-name').value.trim();
        const descricao = form.querySelector('#subcategory-description').value.trim();
        const categoria_id = form.querySelector('#parent-category-id').value;

        if (!nome) {
            showNotification('O nome da subcategoria é obrigatório.', 'error');
            return;
        }

        try {
            const data = { nome, descricao, categoria_id };
            const message = id ? 'Subcategoria atualizada!' : 'Subcategoria criada!';
            await (id ? apiSubcategoriaService.atualizar(id, data) : apiSubcategoriaService.criar(data));
            showNotification(message, 'success');
            subcategoryModal.close();
            
            const accordionItem = document.querySelector(`.accordion-item[data-category-id="${categoria_id}"]`);
            if (accordionItem) {
                accordionItem.querySelector('.subcategory-list').dataset.loaded = 'false';
                if (accordionItem.querySelector('.accordion-content').style.display === 'block') {
                    handleToggleAccordion(accordionItem); // Recarrega se estiver aberto
                }
            }
        } catch (error) {
            showNotification('Erro ao salvar subcategoria: ' + error.message, 'error');
        }
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === 'category') {
                await apiCategoriaService.deletar(itemToDelete.id);
                showNotification('Categoria excluída!', 'success');
                fetchAndRenderCategories();
            } else {
                await apiSubcategoriaService.deletar(itemToDelete.id);
                showNotification('Subcategoria excluída!', 'success');
                itemToDelete.element.remove();
            }
        } catch (error) {
            showNotification(`Erro ao deletar: ${error.message}`, 'error');
        } finally {
            confirmDeleteModal.close();
            itemToDelete = null;
        }
    });

    
    categoryContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.btn-action');
        if (!button) return;

        const accordionItem = button.closest('.accordion-item');
        const categoryId = accordionItem?.dataset.categoryId;
        const categoryData = categoriesOnCurrentPage.find(c => c.id == categoryId);
        
        if (button.classList.contains('btn-toggle')) {
            handleToggleAccordion(accordionItem);
            return;
        }
        
        if (!categoryData) return;

        if (button.classList.contains('btn-add-subcategory')) {
            subcategoryModal.open(modal => {
                modal.querySelector('#subcategory-modal-title').textContent = `Nova Subcategoria em "${categoryData.nome}"`;
                modal.querySelector('#parent-category-id').value = categoryData.id;
            });
        } else if (button.classList.contains('btn-edit-category')) {
            categoryModal.open(modal => {
                modal.querySelector('#category-modal-title').textContent = 'Editar Categoria';
                modal.querySelector('#category-id').value = categoryData.id;
                modal.querySelector('#category-name').value = categoryData.nome;
                modal.querySelector('#category-description').value = categoryData.descricao || '';
            });
        } else if (button.classList.contains('btn-delete-category')) {
            itemToDelete = { type: 'category', id: categoryId };
            confirmDeleteModal.open(modal => {
                modal.querySelector('#confirm-delete-message').textContent = `Excluir a categoria "${categoryData.nome}" e TODAS as suas subcategorias?`;
            });
        }
        
        const subcategoryItem = button.closest('li[data-subcategory-id]');
        if (subcategoryItem) {
            const subcategoryData = {
                id: subcategoryItem.dataset.subcategoryId,
                nome: subcategoryItem.dataset.subcategoryName,
                descricao: subcategoryItem.dataset.subcategoryDescription
            };

            if (button.classList.contains('btn-edit-subcategory')) {
                subcategoryModal.open(modal => {
                    modal.querySelector('#subcategory-modal-title').textContent = `Editar Subcategoria em "${categoryData.nome}"`;
                    modal.querySelector('#parent-category-id').value = categoryData.id;
                    modal.querySelector('#subcategory-id').value = subcategoryData.id;
                    modal.querySelector('#subcategory-name').value = subcategoryData.nome;
                    modal.querySelector('#subcategory-description').value = subcategoryData.descricao;
                });
            } else if (button.classList.contains('btn-delete-subcategory')) {
                itemToDelete = { type: 'subcategory', id: subcategoryData.id, element: subcategoryItem };
                confirmDeleteModal.open(modal => {
                    modal.querySelector('#confirm-delete-message').textContent = `Tem certeza que deseja excluir a subcategoria "${subcategoryData.nome}"?`;
                });
            }
        }
    });

    fetchAndRenderCategories();
});