/**
 * controlar a exibição e o comportamento de modais.
 * configurada para usar classes CSS para animações.
 */
export class ModalManager {
    /**
     * @param {string} modalId - O ID do elemento do modal no HTML.
     * @param {object} [options] - Opções de configuração.
     * @param {string} [options.activeClassName] - O nome da classe para ativar animações CSS (ex: 'active').
     */
    constructor(modalId, options = {}) {
        this.modalElement = document.getElementById(modalId);
        if (!this.modalElement) {
            throw new Error(`Elemento do modal com ID "${modalId}" não foi encontrado.`);
        }

        // Armazena as opções de configuração na instância da classe
        this.activeClassName = options.activeClassName;

        this.form = this.modalElement.querySelector('form');
        const cancelButton = this.modalElement.querySelector('.btn-cancel');

        // Listeners para fechar o modal
        if (cancelButton) {
            // Previne o comportamento padrão (como submit de formulário)
            cancelButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.close();
            });
        }
        this.modalElement.addEventListener('click', (event) => {
            if (event.target === this.modalElement) {
                this.close();
            }
        });
    }

    /**
     * Abre o modal. Aciona animações se 'activeClassName' foi fornecida.
     * @param {Function} [onOpenCallback] - Uma função a ser executada para preencher o modal com dados.
     */
    open(onOpenCallback) {
        if (this.form) {
            this.form.reset();
        }
        if (onOpenCallback) {
            onOpenCallback(this.modalElement);
        }

        this.modalElement.style.display = 'flex';

        // Se uma classe de animação foi configurada, usa a lógica de animação
        if (this.activeClassName) {
            setTimeout(() => {
                this.modalElement.classList.add(this.activeClassName);
            }, 10); // Delay para garantir que a transição CSS seja acionada
        }
    }

    /**
     * Fecha o modal. Aciona animações se 'activeClassName' foi fornecida.
     */
    close() {
        // Se uma classe de animação foi configurada, usa a lógica de animação
        if (this.activeClassName) {
            this.modalElement.classList.remove(this.activeClassName);

            // Espera a animação de saída terminar antes de esconder o elemento
            const onTransitionEnd = () => {
                this.modalElement.style.display = 'none';
                this.modalElement.removeEventListener('transitionend', onTransitionEnd);
            };
            this.modalElement.addEventListener('transitionend', onTransitionEnd);
        } else {
            // Se não houver animação, simplesmente esconde o modal
            this.modalElement.style.display = 'none';
        }
    }

    /**
     * Adiciona um listener para o evento de 'submit' do formulário do modal.
     * @param {Function} submitCallback - A função a ser executada no submit.
     */
    handleSubmit(submitCallback) {
        if (this.form) {
            this.form.addEventListener('submit', async (event) => {
                event.preventDefault();
                await submitCallback(this.form);
            });
        }
    }
}