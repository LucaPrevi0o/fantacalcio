// public/js/modules/players.js
import Helpers from '../utils/helpers.js';

class PlayersManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.giocatori = [];
        this.currentPlayer = null;
        this.onPlayerSelected = null; // Callback for when a player is selected
        
        this.initializeElements();
        this.initializeEvents();
    }

    initializeElements() {
        this.ruoloSelect = document.getElementById('ruoloSelect');
        this.searchInput = document.getElementById('searchInput');
        this.giocatoriTable = document.getElementById('giocatori-table');
        this.currentPlayerInfo = document.getElementById('current-player-info');
    }

    initializeEvents() {
        this.ruoloSelect.addEventListener('change', () => this.displayPlayers(true));
        
        // Debounce search input
        const debouncedSearch = Helpers.debounce(() => this.displayPlayers(true), 300);
        this.searchInput.addEventListener('input', debouncedSearch);
    }

    async loadPlayers() {
        const stopLoading = Helpers.showLoading(
            document.querySelector('#btnAsta'), 
            'Caricamento...'
        );

        try {
            this.giocatori = await this.apiClient.getGiocatori();
            this.displayPlayers();
            stopLoading();
        } catch (error) {
            console.error('Error loading players:', error);
            this.showErrorState();
            stopLoading();
        }
    }

    displayPlayers(autoSwitchToTeams = false) {
        const ruolo = this.ruoloSelect.value;
        const search = this.searchInput.value.trim().toLowerCase();
        const tbody = this.giocatoriTable.querySelector('tbody');
        
        tbody.innerHTML = '';

        // Filter players
        const filtered = this.giocatori.filter(g => 
            (!ruolo || g.ruolo_classic === ruolo) &&
            (!search || (g.nome && g.nome.toLowerCase().includes(search)))
        );

        // Update current player info
        this.updateCurrentPlayerInfo();

        // Render filtered players
        filtered.forEach((player, index) => {
            const row = this.createPlayerRow(player, index, filtered);
            tbody.appendChild(row);
        });

        // Auto-switch to teams view if requested
        if (autoSwitchToTeams && this.currentPlayer && !document.getElementById('teams-table')) {
            this.triggerTeamsView();
        }
    }

    createPlayerRow(player, index, filteredList) {
        const roleInfo = Helpers.getRoleInfo(player.ruolo_classic);
        const tr = document.createElement('tr');
        
        if (player.sold === true) {
            tr.classList.add('player-sold');
        }

        const nameCell = player.sold
            ? `<span class="giocatore-link giocatore-sold" data-index="${index}">${player.nome}</span>`
            : `<a href="#giocatore-attuale" class="giocatore-link" data-index="${index}">${player.nome}</a>`;

        tr.innerHTML = `
            <td><span class="role-box ${roleInfo.cls}">${roleInfo.letter}</span></td>
            <td>${nameCell}</td>
            <td>${player.squadra}</td>
            <td>${player.quot_ini}</td>
            <td>${player.quot_att}</td>
            <td>${player.fvm}</td>
        `;

        // Add click event for player selection
        const link = tr.querySelector('.giocatore-link');
        if (link && !player.sold) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectPlayer(filteredList[index]);
            });
        }

        return tr;
    }

    selectPlayer(player) {
        this.currentPlayer = player;
        this.displayPlayers(); // Refresh to update info
        Helpers.scrollToTop();
        
        // Trigger teams view
        this.triggerTeamsView();
        
        // Notify listeners (auction manager)
        if (this.onPlayerSelected) {
            this.onPlayerSelected(player);
        }
    }

    updateCurrentPlayerInfo() {
        if (!this.currentPlayer) {
            this.currentPlayerInfo.innerHTML = 
                '<span class="giocatore-non-trovato">Nessun giocatore selezionato.</span>';
            return;
        }

        const player = this.currentPlayer;
        const roleInfo = Helpers.getRoleInfo(player.ruolo_classic);

        this.currentPlayerInfo.innerHTML = `
            <div class="giocatore-nome">
                <span class="giocatore-attuale-label">Giocatore attuale:</span> ${player.nome}
            </div>
            <div class="giocatore-ruolo-team">
                <span class="role-box ${roleInfo.cls}" title="${roleInfo.label}">${roleInfo.letter}</span>
                <span>${roleInfo.label}</span>
                <span class="giocatore-squadra">${player.squadra}</span>
            </div>
            <div class="giocatore-prezzi">
                <div class="prezzo-box">
                    <span class="prezzo-label">Quotazione iniziale</span>
                    <span class="prezzo-val">${player.quot_ini}</span>
                </div>
                <div class="prezzo-box">
                    <span class="prezzo-label">Quotazione attuale</span>
                    <span class="prezzo-val">${player.quot_att}</span>
                </div>
                <div class="prezzo-box">
                    <span class="prezzo-label">FVM / 1000</span>
                    <span class="prezzo-val">${player.fvm}</span>
                </div>
            </div>
            ${this.createStatsBox(player)}
        `;
    }

    createStatsBox(player) {
        return `
            <div class="giocatore-stats-box">
                <h3>Statistiche stagione 2024/2025</h3>
                <div class="giocatore-stats-row">
                    <div class="stat-box">
                        <span class="stat-label">Presenze</span>
                        <span class="stat-val">${player.presenze ?? '-'}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Media &nbsp;|&nbsp; Fantamedia</span>
                        <span class="stat-val">
                            ${Helpers.formatNumber(player.media_voto)}
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            ${Helpers.formatNumber(player.fanta_media)}
                        </span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">${
                            player.ruolo_classic === 'p' ? "Gol subiti" : "Gol"
                        } &nbsp;|&nbsp; Assist</span>
                        <span class="stat-val">
                            ${player.ruolo_classic === 'p' 
                                ? (player.gol_subiti ?? '-') 
                                : (player.gol ?? '-')
                            }
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            ${player.assist ?? '-'}
                        </span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Rigori</span>
                        <span class="stat-val">${player.rigori_fatti ?? '-'}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">AMM - ESP</span>
                        <span class="stat-val">${player.ammonizioni ?? '-'} - ${player.espulsioni ?? '-'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    triggerTeamsView() {
        const teamsBtn = document.getElementById('vediSquadreBtn');
        if (teamsBtn && !document.getElementById('teams-table')) {
            const event = new Event('click');
            event.autoSwitch = true;
            teamsBtn.dispatchEvent(event);
        }
    }

    showErrorState() {
        const tbody = this.giocatoriTable.querySelector('tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="errore-dati">
                    Errore nel caricamento dei dati
                </td>
            </tr>
        `;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    resetCurrentPlayer() {
        this.currentPlayer = null;
        this.displayPlayers();
        
        if (this.onPlayerSelected) {
            this.onPlayerSelected(null);
        }
    }

    // Set callback for player selection events
    setPlayerSelectedCallback(callback) {
        this.onPlayerSelected = callback;
    }
}

export default PlayersManager;