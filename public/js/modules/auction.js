// public/js/modules/auction.js
import Helpers from '../utils/helpers.js';

class AuctionManager {
    constructor(audioManager, apiClient) {
        this.audioManager = audioManager;
        this.apiClient = apiClient;
        this.astaInterval = null;
        this.astaTimeLeft = 0;
        this.currentPlayer = null;
        
        this.btnAsta = document.getElementById('btnAsta');
        this.initializeEvents();
    }

    initializeEvents() {
        this.btnAsta.addEventListener('click', () => this.startAuction());
    }

    setCurrentPlayer(player) {
        this.currentPlayer = player;
        this.btnAsta.disabled = !player;
    }

    startAuction() {
        if (!this.currentPlayer) return;

        // Clear any existing interval
        if (this.astaInterval) {
            clearInterval(this.astaInterval);
        }

        // Reset timer
        this.astaTimeLeft = 6;
        this.btnAsta.textContent = this.astaTimeLeft + 's';
        this.btnAsta.classList.remove('yellow', 'red');
        this.btnAsta.disabled = false;

        // Play initial beep
        this.audioManager.playAuctionBeep(this.astaTimeLeft);

        // Disable UI controls during auction
        this.disableControls(true);

        // Start countdown
        this.astaInterval = setInterval(() => {
            this.astaTimeLeft--;
            this.updateAuctionState();
        }, 1000);
    }

    updateAuctionState() {
        if (this.astaTimeLeft <= 0) {
            this.endAuction();
            return;
        }

        // Update button appearance and sound
        this.updateButtonState();
        this.audioManager.playAuctionBeep(this.astaTimeLeft);
        this.btnAsta.textContent = this.astaTimeLeft + 's';
    }

    updateButtonState() {
        this.btnAsta.classList.remove('yellow', 'red');

        if (this.astaTimeLeft <= 4 && this.astaTimeLeft > 2) {
            this.btnAsta.classList.add('yellow');
        } else if (this.astaTimeLeft <= 2) {
            this.btnAsta.classList.add('red');
        }
    }

    endAuction() {
        clearInterval(this.astaInterval);
        this.btnAsta.textContent = 'Tempo scaduto!';
        this.btnAsta.classList.remove('yellow', 'red');
        this.btnAsta.disabled = true;

        this.showSaleInputs();
    }

    async showSaleInputs() {
        const astaBoxInner = this.btnAsta.parentNode;
        astaBoxInner.classList.add('asta-ended');

        // Create input container
        const inputContainer = Helpers.createElement('div', 'vendita-input-container');

        // Get team names
        const teamNames = await this.getTeamNames();

        // Create buyer select
        const buyerSelect = document.createElement('select');
        buyerSelect.className = 'buyer-input';
        buyerSelect.required = true;
        buyerSelect.innerHTML = teamNames.map(name => `<option value="${name}">${name}</option>`).join('');

        // Create price input
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.placeholder = 'Prezzo';
        priceInput.className = 'price-input';
        priceInput.min = 1;
        priceInput.max = 500;

        inputContainer.appendChild(buyerSelect);
        inputContainer.appendChild(priceInput);
        astaBoxInner.appendChild(inputContainer);

        buyerSelect.focus();

        // Handle submission
        const submitSale = () => this.submitPlayerSale(buyerSelect.value, priceInput.value);
        
        buyerSelect.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitSale();
        });
        
        priceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitSale();
        });
    }

    async getTeamNames() {
        try {
            const setup = await this.apiClient.getSetup();
            return setup.teams || Array.from({ length: 12 }, (_, i) => `Squadra ${i + 1}`);
        } catch (error) {
            console.warn('Could not fetch team names, using fallback');
            return Array.from({ length: 12 }, (_, i) => `Squadra ${i + 1}`);
        }
    }

    async submitPlayerSale(buyer, price) {
        if (!buyer || !price.trim()) return;

        try {
            const playerData = {
                ...this.currentPlayer,
                acquirente: buyer,
                prezzo_pagato: price.trim()
            };

            await this.apiClient.addVenduto(playerData);
            window.location.reload(); // Reload to update the UI
        } catch (error) {
            Helpers.showError('Errore nel salvare la vendita');
            console.error('Error submitting player sale:', error);
        }
    }

    disableControls(disabled) {
        const controls = [
            'vediSquadreBtn',
            'ruoloSelect',
            'searchInput'
        ];

        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = disabled;
            }
        });
    }

    reset() {
        if (this.astaInterval) {
            clearInterval(this.astaInterval);
            this.astaInterval = null;
        }
        
        this.btnAsta.textContent = 'Inizia asta';
        this.btnAsta.classList.remove('yellow', 'red');
        this.btnAsta.disabled = !this.currentPlayer;
        this.disableControls(false);

        // Remove sale inputs if they exist
        const saleInputs = document.querySelector('.vendita-input-container');
        if (saleInputs) {
            saleInputs.remove();
        }

        const astaBoxInner = this.btnAsta.parentNode;
        astaBoxInner.classList.remove('asta-ended');
    }
}

export default AuctionManager;