import { apiChatService } from './services/apiChatService.js';
import { apiCategoriaService } from './services/apiCategoriaService.js';
import { startSessionManagement, logoutUser } from './utils/sessionManager.js';

document.addEventListener('DOMContentLoaded', () => {
    startSessionManagement();

    
    const themeSelect = document.getElementById('select-theme');
    const subthemeSelect = document.getElementById('select-subtheme');
    const inputPergunta = document.getElementById('input-pergunta');
    const askButton = document.getElementById('ask-button');
    const answerArea = document.getElementById('answer-area');
    const sourceLinkArea = document.getElementById('source-link-area');
    const feedbackSection = document.getElementById('feedback-section');
    const btnFeedbackSim = document.getElementById('btn-feedback-sim');
    const btnFeedbackNao = document.getElementById('btn-feedback-nao');
    const feedbackStatus = document.getElementById('feedback-status');
    const logoutButton = document.getElementById('logout-btn');
    const backButton = document.getElementById('back-button');
    const feedbackModal = document.getElementById('feedback-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const stars = document.querySelectorAll('.star');
    const feedbackComment = document.getElementById('feedback-comment');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    const notificationContainer = document.getElementById('notification-container');

    let currentSessaoId = null;
    let currentRespostaId = null;
    let currentConsultaId = null;
    let currentRating = 0;

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 4500);
    }

    

    function openFeedbackModal() {
        feedbackModal.style.display = 'flex';
    }

    function closeFeedbackModal() {
        feedbackModal.style.display = 'none';
        currentRating = 0;
        feedbackComment.value = '';
        stars.forEach(star => star.classList.remove('selected'));
    }

    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-value'));
            stars.forEach(s => {
                s.classList.toggle('selected', parseInt(s.getAttribute('data-value')) <= currentRating);
            });
        });
    });
    
    
    async function sendFeedback(feedbackData) {
        if (!feedbackData.resposta_id || !feedbackData.consulta_id) return;

        feedbackStatus.textContent = 'A enviar feedback...';
        btnFeedbackSim.disabled = true;
        btnFeedbackNao.disabled = true;

        try {
            await apiChatService.criarFeedback(feedbackData);

            feedbackStatus.textContent = 'Obrigado pelo seu feedback!';
            if (!feedbackData.util) {
                feedbackStatus.textContent += ' A sua questão foi registada para análise.';
            }
        } catch (error) {
            console.error("Erro ao enviar feedback:", error);
            feedbackStatus.textContent = 'Erro ao enviar.';
            btnFeedbackSim.disabled = false;
            btnFeedbackNao.disabled = false;
        }
    }


    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentSessaoId) {
                apiChatService.encerrarSessao(currentSessaoId);
            }
            logoutUser(); 
        });
    }
    
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            const userDataString = localStorage.getItem('loggedInUser');
            if (userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    const userRole = userData.perfil?.nome?.toLowerCase();
                    if (userRole === 'administrador') {
                        window.location.href = './dashboard.html';
                    } else {
                        logoutUser();
                    }
                } catch (error) {
                    console.error("Erro ao processar dados do usuário:", error);
                    logoutUser("Ocorreu um erro ao verificar seu perfil.");
                }
            } else {
                logoutUser("Não foi possível verificar seu perfil. A fazer logout.");
            }
        });
    }

    async function inicializarChat() {
        try {
            const response = await apiChatService.iniciarSessao();
            currentSessaoId = response.sessao.id;
            console.log("Sessão de Chat ativa:", currentSessaoId);
            const temas = await apiCategoriaService.pegarTodasCategorias();
            popularTemas(temas);
        } catch (error) {
            console.error("Erro ao inicializar o chat:", error);
            answerArea.value = "Erro ao iniciar o chat. A sua sessão pode ter expirado. Tente recarregar a página.";
            themeSelect.disabled = true;
            subthemeSelect.disabled = true;
            inputPergunta.disabled = true;
            askButton.disabled = true;
        }
    }

    function popularTemas(temas) {
        themeSelect.innerHTML = '<option value="" disabled selected>Selecione um tema...</option>';
        temas.forEach(tema => {
            const option = new Option(tema.nome, tema.id);
            themeSelect.add(option);
        });
    }

    async function handleThemeChange() {
        const categoriaId = themeSelect.value;
        subthemeSelect.innerHTML = '<option value="" disabled selected>Buscando...</option>';
        subthemeSelect.disabled = true;
        inputPergunta.disabled = true;
        askButton.disabled = true;

        if (categoriaId) {
            try {
                const subtemas = await apiCategoriaService.pegarSubcategoriasPorCategoriaId(categoriaId);
                subthemeSelect.innerHTML = '<option value="" disabled selected>Selecione um micro-tema...</option>';
                subtemas.forEach(sub => {
                    const option = new Option(sub.nome, sub.id);
                    subthemeSelect.add(option);
                });
                subthemeSelect.disabled = false;
            } catch (error) {
                console.error("Erro ao carregar micro-temas:", error);
                subthemeSelect.innerHTML = '<option value="">Erro ao carregar</option>';
            }
        }
    }

    async function handleAsk() {
        const pergunta = inputPergunta.value.trim();
        const subcategoria_id = subthemeSelect.value;
        if (!pergunta || !subcategoria_id) {
            showNotification("Por favor, selecione os temas e digite a sua pergunta.", 'error');
            return;
        }
        
        askButton.disabled = true;
        answerArea.value = 'Buscando a melhor resposta...';
        sourceLinkArea.style.display = 'none';
        feedbackSection.style.display = 'none';
        feedbackStatus.textContent = '';
        btnFeedbackSim.disabled = false;
        btnFeedbackNao.disabled = false;
        
        try {
            const dadosConsulta = { pergunta, sessao_id: currentSessaoId, subcategoria_id };
            const respostaCompleta = await apiChatService.criarConsultaEObterResposta(dadosConsulta);

            currentRespostaId = respostaCompleta.resposta_id;
            currentConsultaId = respostaCompleta.consulta_id;
            answerArea.value = respostaCompleta.answer;

            if (respostaCompleta.url_fonte) {
                sourceLinkArea.innerHTML = `<b>Fonte:</b> <a href="${respostaCompleta.url_fonte}" target="_blank" rel="noopener noreferrer">${respostaCompleta.titulo_fonte}</a>`;
                sourceLinkArea.style.display = 'block';
            }

            feedbackSection.style.display = 'block';
            
        } catch (error) {
            console.error("Erro no fluxo de pergunta:", error);
           showNotification('Desculpe, ocorreu um erro ao buscar sua resposta. Tente novamente.', 'error');
           answerArea.value = '';
        } finally {
            askButton.disabled = false;
        }
    }

    themeSelect.addEventListener('change', handleThemeChange);
    subthemeSelect.addEventListener('change', () => {
        if (subthemeSelect.value) {
            inputPergunta.disabled = false;
            askButton.disabled = false;
        }
    });

    askButton.addEventListener('click', handleAsk);
    inputPergunta.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAsk();
        }
    });

    // Botão "Sim" apenas abre o modal
    btnFeedbackSim.addEventListener('click', openFeedbackModal);

    // Botão "Não" envia o feedback negativo diretamente
    btnFeedbackNao.addEventListener('click', () => {
        const feedbackData = {
            util: false,
            nota: 0, 
            comentario: '', 
            resposta_id: currentRespostaId,
            consulta_id: currentConsultaId
        };
        sendFeedback(feedbackData);
    });

    // Botão de submissão do modal (feedback positivo)
    submitFeedbackBtn.addEventListener('click', () => {
        const feedbackData = {
            util: true,
            nota: currentRating,
            comentario: feedbackComment.value.trim(),
            resposta_id: currentRespostaId,
            consulta_id: currentConsultaId
        };
        sendFeedback(feedbackData);
        closeFeedbackModal();
    });

    closeModalBtn.addEventListener('click', closeFeedbackModal);
    window.addEventListener('click', (event) => {
        if (event.target == feedbackModal) {
            closeFeedbackModal();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (currentSessaoId) {
            apiChatService.encerrarSessao(currentSessaoId);
        }
    });

    inicializarChat();
});