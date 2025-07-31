function validarCamposObrigatorios(campos) {
    for (const campo of campos) {
        if (campo === null || campo === undefined || (typeof campo === 'string' && campo.trim() === '')) {
            return false;
        }
    }
    return true;
}

module.exports = {
    validarCamposObrigatorios
};