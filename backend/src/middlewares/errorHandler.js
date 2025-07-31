function errorHandler(err, req, res, next) {
    console.error(`[ERRO NO SERVIDOR] Caminho: ${req.path}, Método: ${req.method}, Erro: ${err.message}`);
    console.error(err.stack);

    // Erros específicos do Sequelize (ORM)
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            message: 'Erro de conflito: O registro já existe ou um valor único foi duplicado.',
            details: err.errors.map(e => e.message)
        });
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            message: 'Erro de validação: Dados inválidos foram fornecidos.',
            details: err.errors.map(e => e.message)
        });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({
            message: 'Conflito de dados: Não é possível completar a operação devido a uma relação existente.',
            details: 'Verifique se o item está sendo referenciado por outros registros ou se há dependências.'
        });
    }

    // Erros de autenticação/autorização
    if (err.name === 'UnauthorizedError' || err.status === 401) {
        return res.status(401).json({ message: 'Não autorizado: Token inválido ou ausente.' });
    }

    if (err.name === 'ForbiddenError' || err.status === 403) {
        return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para realizar esta ação.' });
    }

    // Erros HTTP gerados manualmente com status 
    if (err.status && err.message) {
        return res.status(err.status).json({ message: err.message });
    }

    // Erro genérico (fallback)
    res.status(500).json({ message: 'Erro interno no servidor.', error: err.message });
}

module.exports = errorHandler;