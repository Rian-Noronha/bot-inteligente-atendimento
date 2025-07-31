/**
 * Exibe uma notificação na tela e a remove após um tempo.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} [type='success'] - O tipo de notificação ('success' ou 'error').
 */
export function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('O elemento #notification-container não foi encontrado no DOM.');
        return;
    }
    const notification = document.createElement('div');
    notification.className = `notification ${type}`; 
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 4500);
}