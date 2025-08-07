import { apiCategoriaService } from './services/apiCategoriaService.js';
import { apiKnowledgeLibraryService } from './services/apiKnowledgeLibraryService.js';
import { storageService } from './services/storageService.js';
import { startSessionManagement, logoutUser } from './utils/sessionManager.js';
import { showNotification } from './utils/notifications.js';
import { auth } from './config/firebase.js';
import { signInWithCustomToken } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
    let isUserAuthenticated = false;

    const form = document.getElementById('upload-form');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    const logoutButton = document.getElementById('logout-btn');
    const themeSelect = document.getElementById('select-theme');
    const subthemeSelect = document.getElementById('select-subtheme');
    const documentTitleInput = document.getElementById('document-title');
    const documentDescriptionTextarea = document.getElementById('document-description');
    const documentKeywordsInput = document.getElementById('document-keywords');
    const textSolutionTextarea = document.getElementById('text-solution');
    const arquivoInput = document.getElementById('arquivo-input');
    
    async function popularTemas() {
        try {
            const temas = await apiCategoriaService.pegarTodasCategorias();
            themeSelect.innerHTML = '<option value="">Selecione um tema...</option>';
            temas.forEach(tema => themeSelect.add(new Option(tema.nome, tema.id)));
        } catch (error) {
            console.error('Erro ao carregar temas:', error);
            uploadStatus.textContent = 'Erro ao carregar categorias.';
        }
    }

    async function popularMicroTemas() {
        const temaId = themeSelect.value;
        subthemeSelect.innerHTML = '<option value="">A carregar...</option>';
        subthemeSelect.disabled = true;
        if (!temaId) {
            subthemeSelect.innerHTML = '<option value="">Escolha um tema primeiro...</option>';
            checkFormValidity();
            return;
        }
        try {
            const microtemas = await apiCategoriaService.pegarSubcategoriasPorCategoriaId(temaId);
            subthemeSelect.innerHTML = '<option value="">Selecione um micro-tema...</option>';
            microtemas.forEach(sub => subthemeSelect.add(new Option(sub.nome, sub.id)));
            subthemeSelect.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar micro-temas:', error);
            subthemeSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        } finally {
            checkFormValidity();
        }
    }

    function checkFormValidity() {
        const baseFormValid = form.checkValidity();
        const solutionOrFileProvided = textSolutionTextarea.value.trim() !== '' || arquivoInput.files.length > 0;
        uploadButton.disabled = !(baseFormValid && solutionOrFileProvided);
    }

    /**
     * LÓGICA DE ENVIO DO FORMULÁRIO 
     */
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (uploadButton.disabled) return;

        uploadButton.disabled = true;
        uploadStatus.style.color = 'var(--cor-fonte)';
        uploadStatus.textContent = 'Iniciando...';

        try {
            // Prepara todas as variáveis relacionadas ao arquivo
            let fileUrl = null;
            let filePath = null;
            let fileType = null;
            const file = arquivoInput.files[0];

            // PASSO 1: Se houver um arquivo, faz o upload e captura TODOS os dados dele.
            if (file) {
                const onUploadProgress = (progress) => {
                    uploadStatus.textContent = `Enviando ficheiro para a nuvem... ${progress.toFixed(0)}%`;
                };
                
                // Chama o storageService, que retorna um objeto com URL e caminho
                const uploadResult = await storageService.uploadFile(file, 'documentos', onUploadProgress);
                
                // Atribui os valores capturados
                fileUrl = uploadResult.downloadURL;
                filePath = uploadResult.filePath;
                fileType = file.type; // Pega o MIME type diretamente do objeto File
            }

            uploadStatus.textContent = 'Preparando dados para análise...';

            // PASSO 2: Monta o payload final para a API com TODOS os campos.
            const dadosParaCriar = {
                titulo: documentTitleInput.value.trim(),
                descricao: documentDescriptionTextarea.value.trim(),
                subcategoria_id: parseInt(subthemeSelect.value, 10),
                palavrasChave: documentKeywordsInput.value.trim().split(',').map(p => p.trim()).filter(Boolean),
                solucao: textSolutionTextarea.value.trim() || null,
                urlArquivo: fileUrl,
                caminhoArquivo: filePath, // O caminho para o backend deletar
                tipoArquivo: fileType,    // O tipo do arquivo
                ativo: true
            };

            // PASSO 3: Chama a função de criação do serviço.
            uploadStatus.textContent = 'Enviando para processamento da IA...';
            const resultado = await apiKnowledgeLibraryService.criar(dadosParaCriar);

           showNotification(resultado.message || 'Operação concluída com sucesso!', 'success');
           window.location.href = './knowledge_library.html';

        } catch (error) {
            console.error("Erro no envio:", error);
            showNotification(`Erro: ${error.message}`, 'error');
            uploadStatus.textContent = '';
            uploadButton.disabled = false;
        }
    });
    
    async function initializePage() {
        try {
            startSessionManagement();
            console.log("Sessão local validada. Prosseguindo para autenticação do Firebase...");

            // PASSO 2: Autenticação específica do Firebase
            const firebaseCustomToken = localStorage.getItem('firebaseCustomToken');
            if (!firebaseCustomToken) {
                throw new Error("Token de autenticação para upload não encontrado.");
            }

            await signInWithCustomToken(auth, firebaseCustomToken);
            
            console.log("Autenticação com Firebase bem-sucedida. Uploads permitidos.");
            isUserAuthenticated = true;

        } catch (error) {
            console.error("Falha na autenticação para upload:", error.message);
            showNotification("Sua sessão é inválida para fazer uploads. Por favor, faça o login novamente.", 'error');
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }
        
        
        themeSelect.addEventListener('change', popularMicroTemas);
        form.addEventListener('input', checkFormValidity);
        
        await popularTemas();
        
        checkFormValidity();
    }

   
    initializePage();
});