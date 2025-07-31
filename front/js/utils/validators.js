/**
 * Valida se uma string é um e-mail com formato válido.
 * @param {string} email - O e-mail a ser validado.
 * @returns {boolean} - Retorna true se o e-mail for válido, false caso contrário.
 */
export const isValidEmail = (email) => {
    const emailRegex = new RegExp(
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    );
    return emailRegex.test(email);
};

/**
 * Valida a força de uma senha com base em um conjunto de regras.
 * @param {string} password - A senha a ser validada.
 * @returns {{isValid: boolean, message: string}} - Um objeto com o status da validação e uma mensagem.
 */
export const validatePassword = (password) => {
    if (password.length < 8) {
        return { isValid: false, message: 'A senha deve ter no mínimo 8 caracteres.' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'A senha deve conter pelo menos um número.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: 'A senha deve conter pelo menos um caractere especial.' };
    }
    
    return { isValid: true, message: 'Senha válida.' };
};