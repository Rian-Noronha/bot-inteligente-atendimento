/**
 * Cria um middleware de transação do Sequelize.
 * Esta é uma função "fábrica" que recebe a instância do sequelize
 * e retorna o middleware pronto para uso.
 * @param {object} sequelize - A instância do Sequelize.
 * @returns {function} Uma função de ordem superior que envolve um handler de rota com uma transação.
 */
const createWithTransaction = (sequelize) => {
    return (fn) => async (req, res, next) => {
        const t = await sequelize.transaction();
        try {
            await fn(req, res, t); // Executa a função do controller
            await t.commit();     // Sucesso: commita a transação
        } catch (error) {
            await t.rollback();   // Erro: reverte a transação
            next(error);          // Propaga o erro para o errorHandler
        }
    };
};

module.exports = { createWithTransaction };