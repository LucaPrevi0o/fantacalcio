// public/js/main.js
import ApiClient from './utils/api.js';
import AudioManager from './utils/audio.js';
import UIManager from './modules/ui.js';
import PlayersManager from './modules/players.js';
import TeamsManager from './modules/teams.js';
import AuctionManager from './modules/auction.js';

class FantacalcioApp {
    constructor() {
        this.initializeServices();
        this.initializeManagers();
        this.setupEventHandlers();
        this.startApplication();
    }

    initializeServices() {
        this.apiClient = new ApiClient();
        this.audioManager = new AudioManager();
        this.uiManager = new UIManager();
    }

    initializeManagers() {
        // Initialize players manager
        this.playersManager = new PlayersManager(this.apiClient);
        
        // Initialize teams manager
        this.teamsManager = new TeamsManager(this.apiClient);
        
        // Initialize auction manager
        this.auctionManager = new AuctionManager(this.audioManager, this.apiClient);
        
        // Set up communication between managers
        this.setupManagerCommunication();
    }

    setupManagerCommunication() {
        // When a player is selected in players manager, notify auction manager
        this.playersManager.setPlayerSelectedCallback((player) => {
            this.auctionManager.setCurrentPlayer(player);
        });
    }

    setupEventHandlers() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });

        // Handle page visibility changes (pause audio when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Could pause auction timer here if needed
                console.log('Page is now hidden');
            } else {
                console.log('Page is now visible');
            }
        });

        // Handle beforeunload for unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.auctionManager.astaInterval) {
                e.preventDefault();
                e.returnValue = 'C\'è un\'asta in corso. Sei sicuro di voler uscire?';
                return e.returnValue;
            }
        });
    }

    handleGlobalKeyboard(e) {
        // ESC key to reset current auction
        if (e.key === 'Escape' && this.auctionManager.astaInterval) {
            e.preventDefault();
            this.uiManager.showConfirmDialog(
                'Vuoi annullare l\'asta in corso?',
                () => {
                    this.auctionManager.reset();
                    this.uiManager.showInfo('Asta annullata');
                }
            );
        }

        // Space bar to start auction (if a player is selected)
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            const currentPlayer = this.playersManager.getCurrentPlayer();
            if (currentPlayer && !this.auctionManager.astaInterval) {
                this.auctionManager.startAuction();
            }
        }

        // Ctrl+F to focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    }

    async startApplication() {
        try {
            // Show loading state
            this.uiManager.showInfo('Caricamento applicazione...', 2000);

            // Load initial data
            await this.playersManager.loadPlayers();
            
            // Application is ready
            this.uiManager.showSuccess('Applicazione caricata con successo!', 2000);
            
            console.log('Fantacalcio App initialized successfully');
            
        } catch (error) {
            console.error('Error starting application:', error);
            this.uiManager.showError('Errore durante il caricamento dell\'applicazione');
            
            // Try to show some basic functionality even if data loading fails
            this.showErrorState();
        }
    }

    showErrorState() {
        const tbody = document.querySelector('#giocatori-table tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="errore-dati">
                        Errore nel caricamento dei dati. 
                        <button onclick="window.location.reload()" class="retry-btn">
                            Riprova
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    // Public methods for debugging/testing
    getManagers() {
        return {
            players: this.playersManager,
            teams: this.teamsManager,
            auction: this.auctionManager,
            ui: this.uiManager
        };
    }

    // Method to reset the entire application state
    resetApp() {
        this.uiManager.showConfirmDialog(
            'Vuoi resettare completamente l\'applicazione? Questa azione non può essere annullata.',
            async () => {
                try {
                    this.auctionManager.reset();
                    this.playersManager.resetCurrentPlayer();
                    await this.playersManager.loadPlayers();
                    this.uiManager.showSuccess('Applicazione resettata con successo');
                } catch (error) {
                    this.uiManager.showError('Errore durante il reset dell\'applicazione');
                }
            }
        );
    }

    // Method to export current state for backup
    exportState() {
        const state = {
            currentPlayer: this.playersManager.getCurrentPlayer(),
            timestamp: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(state, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fantacalcio-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.uiManager.showSuccess('Backup esportato con successo');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fantacalcioApp = new FantacalcioApp();
});

// Make app available globally for debugging
window.FantacalcioApp = FantacalcioApp;