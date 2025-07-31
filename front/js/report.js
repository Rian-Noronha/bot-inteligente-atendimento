import { startSessionManagement, logoutUser } from './utils/sessionManager.js';
import { apiReportService } from './services/apiReportService.js';
import { showNotification } from './utils/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    startSessionManagement();

    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const logoutButton = document.getElementById('logout-btn');

    
    const totalConsultasEl = document.getElementById('total-subjects');
    const taxaResolucaoEl = document.getElementById('daily-average');
    const topTemaEl = document.getElementById('top-category');
    const indiceRespostasUteisEl = document.getElementById('top-subcategory');
    const duracaoMediaSessaoEl = document.getElementById('peak-weekday');
    const distribuicaoListEl = document.getElementById('distribuicao-list');
    const detalhamentoListEl = document.getElementById('report-results-list');

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }

    const today = new Date();
    endDateInput.value = today.toISOString().split('T')[0];
    const defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 29);
    startDateInput.value = defaultStartDate.toISOString().split('T')[0];

    async function generateReport() {
            
        const startDateValue = startDateInput.value;
        const endDateValue = endDateInput.value;

       
        if (!startDateValue || !endDateValue) {
            showNotification('Por favor, preencha tanto a data inicial quanto a final.', 'error');
            return;
        }

        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);

        if (endDate < startDate) {
            showNotification('A data final não pode ser anterior à data inicial.', 'error');
            return;
        }
        
        try {
            generateReportBtn.disabled = true;
            generateReportBtn.textContent = 'Gerando...';
            const kpis = await apiReportService.getKpis(startDateInput.value, endDateInput.value);
            renderReport(kpis);
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            showNotification(`Falha ao buscar dados: ${error.message}`, 'error');
            renderReport(null);
        } finally {
            generateReportBtn.disabled = false;
            generateReportBtn.textContent = 'Gerar Relatório';
        }
    }

    /**
     *  renderização ficou simplificada por receber um json bem estruturado do backend
     */
    function renderReport(kpis) {
        if (!kpis || kpis.performanceBot.totalConsultas === 0) {
            exportPdfBtn.disabled = true;
            totalConsultasEl.textContent = '0';
            taxaResolucaoEl.textContent = '0.0%';
            topTemaEl.textContent = 'N/A';
            indiceRespostasUteisEl.textContent = '0.0%';
            duracaoMediaSessaoEl.textContent = '0s';
            renderBasicList(distribuicaoListEl, [], "Nenhum tema para exibir.");
            renderBasicList(detalhamentoListEl, [], "Nenhum documento para exibir.");
            return;
        }

        exportPdfBtn.disabled = false;
        totalConsultasEl.textContent = kpis.performanceBot.totalConsultas;
        taxaResolucaoEl.textContent = `${kpis.performanceBot.taxaResolucao}%`;
        topTemaEl.textContent = kpis.conteudo.topTemasProblematicos[0]?.tema || 'N/A';
        indiceRespostasUteisEl.textContent = `${kpis.satisfacaoUsuario.indiceRespostasUteis}%`;
        duracaoMediaSessaoEl.textContent = `${kpis.engajamento.duracaoMediaSessaoSegundos}s`;

        renderBasicList(distribuicaoListEl, kpis.conteudo.topTemasProblematicos, "Nenhum tema problemático encontrado.");
        renderBasicList(detalhamentoListEl, kpis.conteudo.topDocumentosUtilizados, "Nenhum documento utilizado encontrado.");
    }
    
    /**
     * CRIAR LISTAS HTML SIMPLES E SEGURAS
     */
    function renderBasicList(element, data, noResultsMessage) {
        // Limpa o conteúdo anterior para evitar duplicação
        element.innerHTML = '';

        if (!data || data.length === 0) {
            element.innerHTML = `<p class="no-results">${noResultsMessage}</p>`;
            return;
        }

        const listHTML = data.map(item => `
            <div class="report-item">
                <div class="report-item-info">
                    <span class="category">${item.tema || item.titulo}</span>
                </div>
                <div class="report-item-count">${item.total}</div>
            </div>
        `).join('');

        element.innerHTML = listHTML;
    }

    function exportToPdf() {
        const reportArea = document.querySelector('.report-container');
        if (!reportArea) return;

        const originalButtonText = exportPdfBtn.innerHTML;
        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Exportando...';

        html2canvas(reportArea, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const today = new Date().toISOString().slice(0, 10);
            pdf.save(`relatorio-analitico-${today}.pdf`);
            exportPdfBtn.disabled = false;
            exportPdfBtn.innerHTML = originalButtonText;
        });
    }

   
    generateReportBtn.addEventListener('click', generateReport);
    exportPdfBtn.addEventListener('click', exportToPdf);
    generateReport();
});