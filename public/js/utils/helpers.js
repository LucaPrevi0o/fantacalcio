// public/js/utils/helpers.js
class Helpers {
    static scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    static getRoleInfo(ruolo) {
        switch (ruolo) {
            case 'p':
                return { cls: 'role-gk', letter: 'P', label: 'Portiere' };
            case 'd':
                return { cls: 'role-df', letter: 'D', label: 'Difensore' };
            case 'c':
                return { cls: 'role-mf', letter: 'C', label: 'Centrocampista' };
            case 'a':
                return { cls: 'role-st', letter: 'A', label: 'Attaccante' };
            default:
                return { cls: '', letter: ruolo, label: ruolo };
        }
    }

    static formatNumber(num, decimals = 2) {
        if (typeof num !== 'number') return num ?? '-';
        return num.toFixed(decimals).replace('.', ',');
    }

    static createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static showError(message, container = document.body) {
        const errorDiv = this.createElement('div', 'error-message', message);
        container.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    static showLoading(element, text = 'Caricamento...') {
        const originalText = element.textContent;
        element.textContent = text;
        element.disabled = true;
        
        return () => {
            element.textContent = originalText;
            element.disabled = false;
        };
    }
}

export default Helpers;