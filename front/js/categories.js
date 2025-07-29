import { apiCategoriaService } from './services/apiCategoriaService.js';
import { apiSubcategoriaService } from './services/apiSubcategoriaService.js';
import { startSessionManagement } from './utils/sessionManager.js';
import { apiAuthService } from './services/apiAuthService.js';


document.addEventListener('DOMContentLoaded', () => {
    startSessionManagement();

    
    const hamburger = document.getElementById('hamburger');
    const aside = document.querySelector('aside');
    const searchInput = document.getElementById('user-search-input');
    const numDisplayInput = document.getElementById('num-users-display');
    const categoryContainer = document.getElementById('category-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const addCategoryBtn = document.getElementById('add-category-button');
    const logoutButton = document.getElementById('logout-btn');

    
    const categoryModal = document.getElementById('category-modal');
    const categoryModalTitle = document.getElementById('category-modal-title');
    const categoryForm = document.getElementById('category-form');
    const categoryIdInput = document.getElementById('category-id');
    const categoryNameInput = document.getElementById('category-name');
    const categoryDescInput = document.getElementById('category-description');

    
    const subcategoryModal = document.getElementById('subcategory-modal');
    const subcategoryModalTitle = document.getElementById('subcategory-modal-title');
    const subcategoryForm = document.getElementById('subcategory-form');
    const subcategoryIdInput = document.getElementById('subcategory-id');
    const parentCategoryIdInput = document.getElementById('parent-category-id');
    const subcategoryNameInput = document.getElementById('subcategory-name');
    const subcategoryDescInput = document.getElementById('subcategory-description');
    
    
    let allCategories = [];


    // Lógica do Hamburger Menu
        if (hamburger && aside) {
            hamburger.addEventListener('click', () => aside.classList.toggle('open'));
            document.addEventListener('click', (event) => {
                if (aside.classList.contains('open') && !aside.contains(event.target) && !hamburger.contains(event.target)) {
                    aside.classList.remove('open');
                }
            });
        }
    
        // Lógica do botão de logout
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

    // --- Funções de Renderização ---

    /** Renderiza a lista principal de categorias com base nos filtros */
    const applyFiltersAndRender = () => {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredCategories = allCategories.filter(category => 
            category.nome.toLowerCase().includes(searchTerm)
        );

        const numToDisplay = parseInt(numDisplayInput.value, 10);
        if (numToDisplay > 0) {
            filteredCategories = filteredCategories.slice(0, numToDisplay);
        }

        renderCategories(filteredCategories);
    };

    /** Cria o HTML para a lista de categorias */
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
                        <button class="btn-action btn-add-subcategory" title="Adicionar Subcategoria">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                        </button>
                        <button class="btn-action btn-edit-category" title="Editar Categoria">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                        </button>
                        <button class="btn-action btn-delete-category" title="Excluir Categoria">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                        </button>
                        <button class="btn-action btn-toggle" title="Expandir/Recolher">
                            <svg class="toggle-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M180-360 40-500l42-42 70 70q-6-27-9-54t-3-54q0-82 27-159t78-141l43 43q-43 56-65.5 121.5T200-580q0 26 3 51.5t10 50.5l65-64 42 42-140 140Zm478 233q-23 8-46.5 7.5T566-131L304-253l18-40q10-20 28-32.5t40-14.5l68-5-112-307q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l148 407-100 7 131 61q7 3 15 3.5t15-1.5l157-57q31-11 45-41.5t3-61.5l-55-150q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l55 150q23 63-4.5 122.5T815-184l-157 57Zm-90-265-54-151q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l55 150-76 28Zm113-41-41-113q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l41 112-75 28Zm8 78Z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="accordion-content" style="display: none;">
                    <ul class="subcategory-list"></ul>
                    <p class="content-loading" style="display: none;">Carregando subcategorias...</p>
                </div>
            `;
            categoryContainer.appendChild(categoryElement);
        });
    };
        
    /** Renderiza as subcategorias dentro de um item de categoria */
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
                    <button class="btn-action btn-edit-subcategory" title="Editar Subcategoria">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                    </button>
                    <button class="btn-action btn-delete-subcategory" title="Excluir Subcategoria">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                    </button>
                </div>
            `;
            listElement.appendChild(subElement);
        });
    };

    // --- Funções de Abertura/Fechamento de Modais ---
    const openCategoryModal = (category = null) => {
        categoryForm.reset();
        if (category) {
            categoryModalTitle.textContent = 'Editar Categoria';
            categoryIdInput.value = category.id;
            categoryNameInput.value = category.nome;
            categoryDescInput.value = category.descricao || '';
        } else {
            categoryModalTitle.textContent = 'Nova Categoria';
        }
        categoryModal.style.display = 'flex';
    };

    const openSubcategoryModal = (parentCategory, subcategory = null) => {
        subcategoryForm.reset();
        parentCategoryIdInput.value = parentCategory.id;
        if (subcategory) {
            subcategoryModalTitle.textContent = `Editar Subcategoria em "${parentCategory.nome}"`;
            subcategoryIdInput.value = subcategory.id;
            subcategoryNameInput.value = subcategory.nome;
            subcategoryDescInput.value = subcategory.descricao || '';
        } else {
            subcategoryModalTitle.textContent = `Nova Subcategoria em "${parentCategory.nome}"`;
        }
        subcategoryModal.style.display = 'flex';
    };

    const closeModal = (modal) => {
        modal.style.display = 'none';
    };

    // --- Lógica Principal ---
    
    async function fetchAndDisplayAll() {
        loadingMessage.style.display = 'block';
        categoryContainer.innerHTML = '';
        try {
            allCategories = await apiCategoriaService.pegarTodasCategorias();
            applyFiltersAndRender();
        } catch (error) {
            categoryContainer.innerHTML = `<p class="error text-center p-4">Falha ao carregar categorias: ${error.message}</p>`;
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // --- Manipuladores de Eventos (Event Handlers) ---

    // Delegação de eventos no container principal
    categoryContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('.btn-action');
        if (!button) return;

        const accordionItem = button.closest('.accordion-item');
        const categoryId = accordionItem.dataset.categoryId;

        // --- Ação: Expandir/Recolher Acordeão ---
        if (button.classList.contains('btn-toggle')) {
            const content = accordionItem.querySelector('.accordion-content');
            const list = content.querySelector('.subcategory-list');
            const isLoading = content.querySelector('.content-loading');
            const isLoaded = list.dataset.loaded === 'true';
            const isOpening = content.style.display === 'none';

            content.style.display = isOpening ? 'block' : 'none';

           
            // 1. Seleciona o SVG pela classe que demos a ele
            const icon = button.querySelector('.toggle-icon');
            // 2. Adiciona ou remove a classe 'rotated' para o CSS fazer a animação
            if (icon) {
                icon.classList.toggle('rotated', isOpening);
            }
            
            
            if (isOpening && !isLoaded) {
                isLoading.style.display = 'block';
                try {
                    const subcategories = await apiCategoriaService.pegarSubcategoriasPorCategoriaId(categoryId);
                    renderSubcategories(list, subcategories);
                    list.dataset.loaded = 'true';
                } catch (error) {
                    list.innerHTML = `<li class="error">Erro ao carregar.</li>`;
                } finally {
                    isLoading.style.display = 'none';
                }
            }
        }

        const categoryData = allCategories.find(c => c.id == categoryId);

        // Ação: Adicionar Subcategoria
        if (button.classList.contains('btn-add-subcategory')) {
            openSubcategoryModal({ id: categoryId, nome: categoryData.nome });
        }

        // Ação: Editar Categoria
        if (button.classList.contains('btn-edit-category')) {
            openCategoryModal(categoryData);
        }

        // Ação: Deletar Categoria
        if (button.classList.contains('btn-delete-category')) {
            if (confirm(`Tem certeza que deseja excluir a categoria "${categoryData.nome}" e TODAS as suas subcategorias? Esta ação não pode ser desfeita.`)) {
                try {
                    await apiCategoriaService.deletar(categoryId);
                    fetchAndDisplayAll();
                } catch(error) {
                    alert('Erro ao deletar categoria: ' + error.message);
                }
            }
        }
        
        // Ações para Subcategorias
        const subcategoryItem = button.closest('li[data-subcategory-id]');
        if (subcategoryItem) {
            const subcategoryId = subcategoryItem.dataset.subcategoryId;

            // Ação: Editar Subcategoria
            if (button.classList.contains('btn-edit-subcategory')) {
                const subcategoryData = {
                    id: subcategoryId,
                    nome: subcategoryItem.dataset.subcategoryName,
                    descricao: subcategoryItem.dataset.subcategoryDescription
                };
                openSubcategoryModal({ id: categoryId, nome: categoryData.nome }, subcategoryData);
            }

            // Ação: Deletar Subcategoria
            if (button.classList.contains('btn-delete-subcategory')) {
                if (confirm(`Tem certeza que deseja excluir a subcategoria "${subcategoryItem.dataset.subcategoryName}"?`)) {
                    try {
                        await apiSubcategoriaService.deletar(subcategoryId);
                        subcategoryItem.remove(); // Remove o item da lista sem recarregar tudo
                    } catch(error) {
                        alert('Erro ao deletar subcategoria: ' + error.message);
                    }
                }
            }
        }
    });

    // --- Listeners dos Modais e Filtros ---

    addCategoryBtn.addEventListener('click', () => openCategoryModal());
    categoryModal.querySelector('.btn-cancel').addEventListener('click', () => closeModal(categoryModal));
    subcategoryModal.querySelector('.btn-cancel').addEventListener('click', () => closeModal(subcategoryModal));

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = categoryIdInput.value;
        const data = { nome: categoryNameInput.value, descricao: categoryDescInput.value };
        try {
            id ? await apiCategoriaService.atualizar(id, data) : await apiCategoriaService.criar(data);
            closeModal(categoryModal);
            fetchAndDisplayAll();
        } catch (error) {
            alert('Erro ao salvar categoria: ' + error.message);
        }
    });

    subcategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = subcategoryIdInput.value;
        const data = { 
            nome: subcategoryNameInput.value, 
            descricao: subcategoryDescInput.value,
            categoria_id: parentCategoryIdInput.value
        };
        try {
            id ? await apiSubcategoriaService.atualizar(id, data) : await apiSubcategoriaService.criar(data);
            closeModal(subcategoryModal);
            // Invalida o cache da lista de subcategorias para forçar recarregamento na próxima abertura
            const accordionContent = document.querySelector(`.accordion-item[data-category-id="${data.categoria_id}"] .subcategory-list`);
            if (accordionContent) {
                accordionContent.dataset.loaded = 'false';
                accordionContent.parentElement.style.display = 'none'; // Fecha o acordeão para recarregar
            }
        } catch (error) {
            alert('Erro ao salvar subcategoria: ' + error.message);
        }
    });

    searchInput.addEventListener('input', applyFiltersAndRender);
    numDisplayInput.addEventListener('input', applyFiltersAndRender);
    
    fetchAndDisplayAll();
});