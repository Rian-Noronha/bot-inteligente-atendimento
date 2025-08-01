/**
 * gerenciar a lógica de paginação.
 */
export class PaginationManager {
    /**
     * @param {object} options - 
     * @param {HTMLElement} options.paginationControls - O contêiner dos controles de paginação.
     * @param {HTMLButtonElement} options.prevPageBtn - O botão de página anterior.
     * @param {HTMLButtonElement} options.nextPageBtn - O botão de próxima página.
     * @param {HTMLElement} options.pageInfoSpan - O elemento para exibir "Página X de Y".
     * @param {HTMLInputElement} options.searchInput - O campo de busca.
     * @param {HTMLInputElement} options.itemsPerPageInput - O campo de itens por página.
     * @param {Function} options.onUpdate - A função de callback a ser chamada quando a página ou filtros mudam.
     * @param {number} [options.debounceDelay=0] - O delay em milissegundos para o debounce da busca. Se 0, não há debounce.
     */
    constructor(options) {
        this.currentPage = 1;
        this.totalPages = 1;
        this.options = options; 

        this.elements = {
            controls: options.paginationControls,
            prevBtn: options.prevPageBtn,
            nextBtn: options.nextPageBtn,
            infoSpan: options.pageInfoSpan,
            searchInput: options.searchInput,
            itemsPerPageInput: options.itemsPerPageInput,
        };

        this.onUpdateCallback = options.onUpdate;
        this._initializeListeners();
    }

    /**
     * Função debounce interna.
     * @private
     */
    _debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    _initializeListeners() {
        this.elements.prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.onUpdateCallback();
            }
        });

        this.elements.nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.onUpdateCallback();
            }
        });

        const handleFilterChange = () => {
            this.currentPage = 1;
            this.onUpdateCallback();
        };

        // Aplica o debounce apenas se um delay for fornecido
        if (this.options.debounceDelay && this.options.debounceDelay > 0) {
            this.elements.searchInput.addEventListener('input', this._debounce(handleFilterChange, this.options.debounceDelay));
        } else {
            this.elements.searchInput.addEventListener('input', handleFilterChange);
        }
        
        this.elements.itemsPerPageInput.addEventListener('input', handleFilterChange);
    }
    
    /**
     * Atualiza o estado da paginação
     * @param {number} totalPages 
     */
    updateState(totalPages) {
        this.totalPages = totalPages || 1;
        this._renderControls();
    }

    /**
     * Renderiza o estado atual dos controles de paginação.
     */
    _renderControls() {
        if (this.totalPages <= 1) {
            this.elements.controls.style.display = 'none';
            return;
        }
        this.elements.controls.style.display = 'flex';
        this.elements.infoSpan.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        this.elements.prevBtn.disabled = this.currentPage === 1;
        this.elements.nextBtn.disabled = this.currentPage >= this.totalPages;
    }

    /**
     * Retorna os parâmetros atuais
     */
    getApiParams() {
        return {
            page: this.currentPage,
            limit: parseInt(this.elements.itemsPerPageInput.value, 10) || 10,
            search: this.elements.searchInput.value.trim(),
        };
    }
}