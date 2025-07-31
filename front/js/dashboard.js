import { apiAssuntoPendenteService } from './services/apiAssuntoPendenteService.js';
import { showNotification } from './utils/notifications.js';
import { inicializarUIComum } from './utils/uiComum.js';

document.addEventListener('DOMContentLoaded', () => {

    inicializarUIComum();

    const searchInput = document.querySelector('header form input[type="text"]');
    const itemsPerPageInput = document.getElementById('num-items-display');
    const assuntosContainer = document.querySelector('section.assuntos > div');

    const paginationControlsContainer = document.getElementById('pagination-controls');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');

    
    const assuntoDecisaoModal = document.getElementById('assunto-decisao-modal');
    const assuntoDecisaoIdInput = document.getElementById('assunto-decisao-id');
    const assuntoDecisaoCategoria = document.getElementById('assunto-decisao-categoria');
    const assuntoDecisaoSubcategoria = document.getElementById('assunto-decisao-subcategoria');
    const assuntoDecisaoPergunta = document.getElementById('assunto-decisao-pergunta');
    const btnSimCadastrar = document.getElementById('btn-sim-cadastrar');
    const btnDeletarAssuntoPendente = document.getElementById('btn-deletar');
    
    let assuntosDaPaginaAtual = [];
    let currentPage = 1;
    let totalPages = 1;


    // Função que cria o HTML de um card
    function createCardElement(assunto) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const tema = assunto.subcategoria?.categoria?.nome || 'Tema Desconhecido';
        const microtema = assunto.subcategoria?.nome || 'Microtema Desconhecido';
        const pergunta = assunto.texto_assunto || 'Pergunta não disponível';
        
        cardDiv.dataset.id = assunto.id;
        cardDiv.style.cursor = 'pointer';

        cardDiv.innerHTML = `
            <div class="barra" style="background: var(--cor-fundo-ah-esquerda);"></div>
            <div class="conteudo">
                <h3>${tema}</h3>
                <h4>${microtema}</h4>
                <p>${pergunta}</p>
                <div class="acoes">
                    <button class="btn-decide-assunto" data-id="${assunto.id}" title="Avaliar assunto">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                    </button>
                </div>
            </div>`;
        return cardDiv;
    }

    function renderCards(assuntos) {
        assuntosContainer.innerHTML = '';
        if (assuntos.length === 0) {
            assuntosContainer.innerHTML = '<p class="no-results">Nenhum assunto pendente encontrado.</p>';
            paginationControlsContainer.style.display = 'none';
        } else {
            assuntos.forEach(assunto => {
                const cardElement = createCardElement(assunto);
                assuntosContainer.appendChild(cardElement);
            });
            paginationControlsContainer.style.display = 'flex';
        }
    }

    // Função que renderiza os cards na tela
    async function fetchAndRenderAssuntos() {
        try {
            const searchTerm = searchInput.value.trim();
            const itemsPerPage = parseInt(itemsPerPageInput.value) || 9;

            const response = await apiAssuntoPendenteService.pegarPaginado(currentPage, itemsPerPage, searchTerm);

            assuntosDaPaginaAtual = response.data;
            totalPages = response.meta.totalPages;

            renderCards(assuntosDaPaginaAtual);
            renderPaginationControls();
        } catch (error) {
            console.error('Erro ao buscar assuntos pendentes:', error);
            assuntosContainer.innerHTML = '<p class="no-results">Falha ao carregar dados do servidor.</p>';
        }
    }

    // Função para renderizar os controles de paginação
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

    // Funções do Modal
    function openAssuntoDecisaoModal(assuntoId) {
        const assunto = assuntosDaPaginaAtual.find(a => a.id === assuntoId);
        if (assunto) {
            assuntoDecisaoIdInput.value = assunto.id;
            assuntoDecisaoCategoria.value = assunto.subcategoria?.categoria?.nome || '';
            assuntoDecisaoSubcategoria.value = assunto.subcategoria?.nome || '';
            assuntoDecisaoPergunta.value = assunto.texto_assunto || '';
            btnSimCadastrar.href = `./upload.html?assuntoId=${assunto.id}`;
            assuntoDecisaoModal.style.display = 'flex';
            setTimeout(() => assuntoDecisaoModal.classList.add('active'), 10);
        }
    }

    function closeAssuntoDecisaoModal() {
        assuntoDecisaoModal.classList.remove('active');
        assuntoDecisaoModal.addEventListener('transitionend', function handler() {
            assuntoDecisaoModal.style.display = 'none';
            assuntoDecisaoModal.removeEventListener('transitionend', handler);
        });
    }

    // --- EVENT LISTENERS ESPECÍFICOS DA PÁGINA ---
     btnDeletarAssuntoPendente.addEventListener('click', async () => {
        const assuntoId = parseInt(document.getElementById('assunto-decisao-id').value);
        try {
            await apiAssuntoPendenteService.deletarAssuntoPendente(assuntoId);
            showNotification(`Assunto excluído com sucesso.`, 'success');
            closeAssuntoDecisaoModal();
            fetchAndRenderAssuntos(); 
        } catch (error) {
            console.error('Erro ao deletar assunto:', error);
            showNotification('Não foi possível deletar o assunto.', 'error');
        }
    });

    btnSimCadastrar.addEventListener('click', () => {
        closeAssuntoDecisaoModal();
    });
    
     assuntosContainer.addEventListener('click', (event) => {
        const clickedCard = event.target.closest('.card');
        if (clickedCard) {
            const assuntoId = parseInt(clickedCard.dataset.id, 10);
            if (!isNaN(assuntoId)) openAssuntoDecisaoModal(assuntoId);
        }
    });

    // Listeners de filtro e paginação
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        fetchAndRenderAssuntos();
    });
    itemsPerPageInput.addEventListener('input', () => {
        currentPage = 1;
        fetchAndRenderAssuntos();
    });

    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndRenderAssuntos();
        }
    });
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchAndRenderAssuntos();
        }
    });

    assuntoDecisaoModal.addEventListener('click', (event) => {
        if (event.target === assuntoDecisaoModal) {
            closeAssuntoDecisaoModal();
        }
    });
    
    fetchAndRenderAssuntos();
});