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
                        <button class="btn-action btn-add-subcategory" title="Adicionar Subcategoria"><svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg></button>
                        <button class="btn-action btn-edit-category" title="Editar Categoria"><svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                        <button class="btn-action btn-delete-category" title="Excluir Categoria"><svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                        <button class="btn-action btn-toggle" title="Expandir/Recolher"><svg class="toggle-icon" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="m240-400-80-80 200-200 200 200-80 80-120-120-120 120Z"/></svg></button>
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
                    <button class="btn-action btn-edit-subcategory" title="Editar Subcategoria"><svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
                    <button class="btn-action btn-delete-subcategory" title="Excluir Subcategoria"><svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
                </div>`;
            listElement.appendChild(subElement);
        });
    };

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

    
    categoryContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('.btn-action');
        if (!button) return;

        const accordionItem = button.closest('.accordion-item');
        const categoryId = accordionItem.dataset.categoryId;

        if (button.classList.contains('btn-toggle')) {
            const content = accordionItem.querySelector('.accordion-content');
            const list = content.querySelector('.subcategory-list');
            const isLoading = content.querySelector('.content-loading');
            const isLoaded = list.dataset.loaded === 'true';
            const isOpening = content.style.display === 'none';

            content.style.display = isOpening ? 'block' : 'none';
            const icon = button.querySelector('.toggle-icon');
            if (icon) icon.classList.toggle('rotated', isOpening);
            
            if (isOpening && !isLoaded) {
                isLoading.style.display = 'block';
                try {
                    const subcategories = await apiSubcategoriaService.pegarPorCategoriaId(categoryId);
                    renderSubcategories(list, subcategories);
                    list.dataset.loaded = 'true';
                } catch (error) {
                    list.innerHTML = `<li class="error">Erro ao carregar subcategorias.</li>`;
                } finally {
                    isLoading.style.display = 'none';
                }
            }
        }

        const categoryData = allCategories.find(c => c.id == categoryId);

        if (button.classList.contains('btn-add-subcategory')) {
            openSubcategoryModal({ id: categoryId, nome: categoryData.nome });
        }

        if (button.classList.contains('btn-edit-category')) {
            openCategoryModal(categoryData);
        }

        if (button.classList.contains('btn-delete-category')) {
            if (confirm(`Tem certeza que deseja excluir a categoria "${categoryData.nome}" e TODAS as suas subcategorias?`)) {
                try {
                    await apiCategoriaService.deletar(categoryId);
                    alert('Categoria excluída com sucesso!');
                    fetchAndDisplayAll();
                } catch(error) {
                    alert(`Erro ao deletar: ${error.message}`);
                }
            }
        }
        
        const subcategoryItem = button.closest('li[data-subcategory-id]');
        if (subcategoryItem) {
            const subcategoryId = subcategoryItem.dataset.subcategoryId;

            if (button.classList.contains('btn-edit-subcategory')) {
                const subcategoryData = {
                    id: subcategoryId,
                    nome: subcategoryItem.dataset.subcategoryName,
                    descricao: subcategoryItem.dataset.subcategoryDescription
                };
                openSubcategoryModal({ id: categoryId, nome: categoryData.nome }, subcategoryData);
            }

            if (button.classList.contains('btn-delete-subcategory')) {
                if (confirm(`Tem certeza que deseja excluir a subcategoria "${subcategoryItem.dataset.subcategoryName}"?`)) {
                    try {
                        await apiSubcategoriaService.deletar(subcategoryId);
                        alert('Subcategoria excluída com sucesso!');
                        subcategoryItem.remove();
                    } catch(error) {
                        alert(`Erro ao deletar: ${error.message}`);
                    }
                }
            }
        }
    });

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
            const accordionItem = document.querySelector(`.accordion-item[data-category-id="${data.categoria_id}"]`);
            if (accordionItem) {
                const list = accordionItem.querySelector('.subcategory-list');
                const content = accordionItem.querySelector('.accordion-content');
                const icon = accordionItem.querySelector('.toggle-icon');
                if(list) list.dataset.loaded = 'false';
                if(content) content.style.display = 'none';
                if(icon) icon.classList.remove('rotated');
            }
        } catch (error) {
            alert('Erro ao salvar subcategoria: ' + error.message);
        }
    });

    searchInput.addEventListener('input', applyFiltersAndRender);
    numDisplayInput.addEventListener('input', applyFiltersAndRender);
    
    fetchAndDisplayAll();
});