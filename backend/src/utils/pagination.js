/**
 * Extrai e parseia os parâmetros de paginação (page, limit, search)
 * da query da requisição (req.query).
 * @param {object} reqQuery - O objeto req.query do Express.
 * @returns {{page: number, limit: number, offset: number, search: string}} Parâmetros de paginação.
 */
function getPaginationParams(reqQuery) {
    const page = parseInt(reqQuery.page, 10) || 1;
    const limit = parseInt(reqQuery.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const search = reqQuery.search ? String(reqQuery.search).trim() : '';

    return { page, limit, offset, search };
}

/**
 * Constrói a estrutura de resposta padronizada para endpoints paginados.
 * Inclui os dados da página atual e metadados sobre a paginação.
 * @param {Array} data - Os itens da página atual.
 * @param {number} totalItems - O número total de itens disponíveis.
 * @param {number} currentPage - A página atual.
 * @param {number} itemsPerPage - O número de itens por página.
 * @returns {{data: Array, meta: {totalItems: number, itemsPerPage: number, currentPage: number, totalPages: number}}} Resposta paginada.
 */
function buildPaginationResponse(data, totalItems, currentPage, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return {
        data: data, 
        meta: {
            totalItems: totalItems,   
            itemsPerPage: itemsPerPage, 
            currentPage: currentPage,   
            totalPages: totalPages    
        }
    };
}

module.exports = {
    getPaginationParams,
    buildPaginationResponse
};