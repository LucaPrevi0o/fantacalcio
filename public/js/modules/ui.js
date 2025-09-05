// public/js/modules/ui.js
import Helpers from '../utils/helpers.js';

class UIManager {
    constructor() {
        this.notifications = [];
        this.initializeUI();
    }

    initializeUI() {
        this.createNotificationContainer();
        this.setupGlobalErrorHandler();
    }

    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showNotification('Si è verificato un errore imprevisto', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showNotification('Errore di connessione', 'error');
            event.preventDefault();
        });
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        const container = document.getElementById('notification-container');
        
        container.appendChild(notification);
        this.notifications.push(notification);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.className = 'notification-close';
        closeBtn.onclick = () => this.removeNotification(notification);
        
        notification.appendChild(messageSpan);
        notification.appendChild(closeBtn);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        return notification;
    }

    removeNotification(notification) {
        if (!notification.parentNode) return;

        notification.classList.remove('show');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    showLoading(element, text = 'Caricamento...') {
        return Helpers.showLoading(element, text);
    }

    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }

    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }

    showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }

    showInfo(message, duration = 3000) {
        this.showNotification(message, 'info', duration);
    }

    clearAllNotifications() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }

    // Modal management
    createModal(title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h3>${title}</h3>
            <button class="modal-close">&times;</button>
        `;
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
        
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(modalContent);
        
        // Close events
        const closeBtn = header.querySelector('.modal-close');
        const closeModal = () => {
            modal.classList.add('closing');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                if (options.onClose) {
                    options.onClose();
                }
            }, 300);
        };
        
        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        // ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        return modal;
    }

    // Confirmation dialog
    showConfirmDialog(message, onConfirm, onCancel = null) {
        const content = document.createElement('div');
        content.innerHTML = `
            <p>${message}</p>
            <div class="modal-buttons">
                <button class="btn btn-primary confirm-btn">Conferma</button>
                <button class="btn btn-secondary cancel-btn">Annulla</button>
            </div>
        `;
        
        const modal = this.createModal('Conferma', content);
        
        const confirmBtn = content.querySelector('.confirm-btn');
        const cancelBtn = content.querySelector('.cancel-btn');
        
        confirmBtn.onclick = () => {
            modal.querySelector('.modal-close').click();
            if (onConfirm) onConfirm();
        };
        
        cancelBtn.onclick = () => {
            modal.querySelector('.modal-close').click();
            if (onCancel) onCancel();
        };
        
        return modal;
    }

    // Utility methods for common UI tasks
    toggleElementVisibility(element, show) {
        if (show) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    }

    updateButtonState(button, state) {
        button.classList.remove('loading', 'success', 'error');
        
        switch (state) {
            case 'loading':
                button.classList.add('loading');
                button.disabled = true;
                break;
            case 'success':
                button.classList.add('success');
                button.disabled = false;
                break;
            case 'error':
                button.classList.add('error');
                button.disabled = false;
                break;
            default:
                button.disabled = false;
        }
    }
}

export default UIManager;