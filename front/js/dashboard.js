import { apiAssuntoPendenteService } from './services/apiAssuntoPendenteService.js';
import { showNotification } from './utils/notifications.js';
import { inicializarUIComum } from './utils/uiComum.js';
import { ModalManager } from './utils/ModalManager.js';
import { PaginationManager } from './utils/PaginationManager.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUIComum();

    const assuntosContainer = document.getElementById('assuntos-container');
    const btnSimCadastrar = document.getElementById('btn-sim-cadastrar');
    const btnDeletarAssuntoPendente = document.getElementById('btn-deletar');
    
    let assuntosDaPaginaAtual = [];

    const paginationManager = new PaginationManager({
        paginationControls: document.getElementById('pagination-controls'),
        prevPageBtn: document.getElementById('prev-page-btn'),
        nextPageBtn: document.getElementById('next-page-btn'),
        pageInfoSpan: document.getElementById('page-info'),
        searchInput: document.querySelector('header form input[type="text"]'),
        itemsPerPageInput: document.getElementById('num-items-display'),
        onUpdate: fetchAndRenderAssuntos,
        debounceDelay: 300,
    });

    const decisaoModalManager = new ModalManager('assunto-decisao-modal', {
        activeClassName: 'active'
    });

    async function fetchAndRenderAssuntos() {
        try {
            
            const params = paginationManager.getApiParams();
            const response = await apiAssuntoPendenteService.pegarPaginado(params.page, params.limit, params.search);

            assuntosDaPaginaAtual = response.data;
            renderCards(assuntosDaPaginaAtual);

            paginationManager.updateState(response.meta.totalPages);
        } catch (error) {
            console.error('Erro ao buscar assuntos pendentes:', error);
            assuntosContainer.innerHTML = '<p class="no-results">Falha ao carregar dados do servidor.</p>';
            paginationManager.updateState(1); // Esconde a paginação em caso de erro
        }
    }

    function renderCards(assuntos) {
        assuntosContainer.innerHTML = '';
        if (!assuntos || assuntos.length === 0) {
            assuntosContainer.innerHTML = '<p class="no-results">Nenhum assunto pendente encontrado.</p>';
        } else {
            assuntos.forEach(assunto => {
                const cardElement = createCardElement(assunto);
                assuntosContainer.appendChild(cardElement);
            });
        }
    }

    function createCardElement(assunto) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.dataset.id = assunto.id;
        cardDiv.style.cursor = 'pointer';

        cardDiv.innerHTML = `
            <div class="barra" style="background: var(--cor-fundo-ah-esquerda);"></div>
            <div class="conteudo">
                <h3>${assunto.subcategoria?.categoria?.nome || 'Tema Desconhecido'}</h3>
                <h4>${assunto.subcategoria?.nome || 'Microtema Desconhecido'}</h4>
                <p>${assunto.texto_assunto || 'Pergunta não disponível'}</p>
                <div class="acoes">
                    <button class="btn-decide-assunto" data-id="${assunto.id}" title="Avaliar assunto">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                    </button>
                </div>
            </div>`;
        return cardDiv;
    }

    assuntosContainer.addEventListener('click', (event) => {
        const cardElement = event.target.closest('.card');
        if (!cardElement) {
            return;
        }

        const assuntoId = parseInt(cardElement.dataset.id, 10);
        const assunto = assuntosDaPaginaAtual.find(a => a.id === assuntoId);
        
        if (assunto) {
            decisaoModalManager.open((modalElement) => {
                modalElement.querySelector('#assunto-decisao-id').value = assunto.id;
                modalElement.querySelector('#assunto-decisao-categoria').value = assunto.subcategoria?.categoria?.nome || '';
                modalElement.querySelector('#assunto-decisao-subcategoria').value = assunto.subcategoria?.nome || '';
                modalElement.querySelector('#assunto-decisao-pergunta').value = assunto.texto_assunto || '';
                modalElement.querySelector('#btn-sim-cadastrar').href = `./upload.html?assuntoId=${assunto.id}`;
            });
        }
    });
    
    btnDeletarAssuntoPendente.addEventListener('click', async () => {
        const assuntoId = parseInt(document.getElementById('assunto-decisao-id').value);
        try {
            await apiAssuntoPendenteService.deletarAssuntoPendente(assuntoId);
            showNotification('Assunto excluído com sucesso.', 'success');
            decisaoModalManager.close();
            fetchAndRenderAssuntos(); 
        } catch (error) {
            console.error('Erro ao deletar assunto:', error);
            showNotification('Não foi possível deletar o assunto.', 'error');
        }
    });

    btnSimCadastrar.addEventListener('click', () => {
        decisaoModalManager.close();
    });

    fetchAndRenderAssuntos();
});