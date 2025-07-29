import { getAuthHeaders, handleResponseError } from '../utils/apiUtils.js';

export const apiReportService = {
    /**
     * Busca os dados de KPIs para o dashboard de relatórios.
     * @param {string} startDate - Data de início no formato 'AAAA-MM-DD'.
     * @param {string} endDate - Data de fim no formato 'AAAA-MM-DD'.
     * @returns {Promise<object>} - Uma promessa que resolve para o objeto de KPIs.
     */
    async getKpis(startDate, endDate) {
        const url = new URL('/api/relatorios/kpis', window.location.origin);
        if (startDate) url.searchParams.append('data_inicio', startDate);
        if (endDate) url.searchParams.append('data_fim', endDate);

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            await handleResponseError(response);
        }
        return await response.json();
    }
};