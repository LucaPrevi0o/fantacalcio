// public/js/modules/teams.js
import Helpers from '../utils/helpers.js';

class TeamsManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.teams = [];
        this.maxCredits = 500;
        this.numPlayers = 23;
        
        this.initializeElements();
        this.initializeEvents();
        this.loadSetupData();
    }

    initializeElements() {
        this.vediSquadreBtn = document.getElementById('vediSquadreBtn');
        this.downloadBtn = document.getElementById('download-xlsx-btn');
        this.giocatoriTable = document.getElementById('giocatori-table');
    }

    initializeEvents() {
        this.vediSquadreBtn.addEventListener('click', (e) => this.toggleTeamsView(e));
        this.downloadBtn.addEventListener('click', () => this.downloadExcel());
    }

    async loadSetupData() {
        try {
            const setup = await this.apiClient.getSetup();
            this.maxCredits = setup.initial_amount || 500;
            this.numPlayers = setup.max_players || 23;
            this.teams = setup.teams || [];
        } catch (error) {
            console.warn('Could not load setup data, using defaults');
            this.teams = Array.from({ length: 12 }, (_, i) => `Squadra ${i + 1}`);
        }
    }

    async toggleTeamsView(event) {
        const isAutoSwitch = event && event.autoSwitch;
        let teamsTable = document.getElementById('teams-table');

        if (teamsTable) {
            // Hide teams, show players
            this.hideTeamsView(teamsTable);
        } else {
            // Show teams, hide players
            await this.showTeamsView(isAutoSwitch);
        }
    }

    hideTeamsView(teamsTable) {
        teamsTable.remove();
        this.giocatoriTable.style.display = '';
        this.vediSquadreBtn.textContent = 'Vedi squadre';
        this.downloadBtn.style.display = 'none';
    }

    async showTeamsView(isAutoSwitch) {
        this.giocatoriTable.style.display = 'none';
        this.downloadBtn.style.display = 'block';
        this.vediSquadreBtn.textContent = 'Lista giocatori';

        try {
            const teamsArray = await this.apiClient.getSquadre();
            const teamsTable = this.createTeamsTable(teamsArray);
            
            this.giocatoriTable.parentNode.insertBefore(teamsTable, this.giocatoriTable.nextSibling);
        } catch (error) {
            console.error('Error loading teams data:', error);
            Helpers.showError('Errore nel caricamento delle squadre');
        }
    }

    createTeamsTable(teamsArray) {
        const table = document.createElement('table');
        table.id = 'teams-table';

        // Create header
        const thead = this.createTableHeader();
        table.appendChild(thead);

        // Create body with player data
        const tbody = this.createTableBody(teamsArray);
        table.appendChild(tbody);

        return table;
    }

    createTableHeader() {
        const thead = document.createElement('thead');

        // First row: team names
        const trHead = document.createElement('tr');
        this.teams.forEach(teamName => {
            const th = document.createElement('th');
            th.textContent = teamName;
            th.colSpan = 3;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Second row: credits and max price
        const trCredits = document.createElement('tr');
        this.teams.forEach(teamName => {
            const td = this.createCreditsCell(teamName, teamsArray);
            trCredits.appendChild(td);
        });
        thead.appendChild(trCredits);

        return thead;
    }

    createCreditsCell(teamName, teamsArray) {
        // Find players for this team
        const teamPlayers = teamsArray.find(arr => 
            arr.length && arr[0].acquirente === teamName
        ) || [];

        // Calculate finances
        const totalSpent = teamPlayers.reduce((sum, p) => 
            sum + (parseInt(p.prezzo_pagato) || 0), 0
        );
        const creditsLeft = this.maxCredits - totalSpent;
        const playersBought = teamPlayers.length;
        const playersToBuy = this.numPlayers - playersBought;
        const maxPrice = playersToBuy > 0 ? creditsLeft - (playersToBuy - 1) : 0;

        const td = document.createElement('td');
        td.colSpan = 3;
        td.style.padding = '0';

        // Create inner table for credits display
        const innerTable = document.createElement('table');
        innerTable.style.width = '100%';
        innerTable.style.borderCollapse = 'collapse';

        const innerTr = document.createElement('tr');

        // Credits left cell
        const tdCredits = document.createElement('td');
        tdCredits.textContent = `${creditsLeft}`;
        tdCredits.style.fontWeight = 'bold';
        tdCredits.style.textAlign = 'center';
        tdCredits.style.borderRight = '1px solid #ccc';
        tdCredits.style.background = '#ffd600';

        // Max price cell
        const tdMaxPrice = document.createElement('td');
        tdMaxPrice.textContent = `${maxPrice}`;
        tdMaxPrice.style.fontWeight = 'bold';
        tdMaxPrice.style.textAlign = 'center';
        tdMaxPrice.style.background = '#85f374ff';

        innerTr.appendChild(tdCredits);
        innerTr.appendChild(tdMaxPrice);
        innerTable.appendChild(innerTr);
        td.appendChild(innerTable);

        return td;
    }

    createTableBody(teamsArray) {
        const tbody = document.createElement('tbody');

        // Find maximum number of players for any team
        const maxPlayers = Math.max(
            ...this.teams.map(teamName => {
                const teamPlayers = teamsArray.find(arr => 
                    arr.length && arr[0].acquirente === teamName
                ) || [];
                return teamPlayers.length;
            }),
            1
        );

        // Create rows
        for (let row = 0; row < maxPlayers; row++) {
            const tr = document.createElement('tr');
            
            this.teams.forEach(teamName => {
                const teamPlayers = teamsArray.find(arr => 
                    arr.length && arr[0].acquirente === teamName
                ) || [];
                const player = teamPlayers[row];

                // Add three cells per team: role, name, price
                tr.appendChild(this.createRoleCell(player));
                tr.appendChild(this.createNameCell(player));
                tr.appendChild(this.createPriceCell(player));
            });

            tbody.appendChild(tr);
        }

        return tbody;
    }

    createRoleCell(player) {
        const td = document.createElement('td');
        if (player) {
            const roleInfo = Helpers.getRoleInfo(player.ruolo_classic);
            td.innerHTML = `<span class="role-box ${roleInfo.cls}">${roleInfo.letter}</span>`;
        }
        return td;
    }

    createNameCell(player) {
        const td = document.createElement('td');
        td.textContent = player ? player.nome : '';
        return td;
    }

    createPriceCell(player) {
        const td = document.createElement('td');
        td.textContent = player ? player.prezzo_pagato : '';
        return td;
    }

    downloadExcel() {
        const table = document.getElementById('teams-table');
        if (!table) return;

        try {
            const wb = XLSX.utils.table_to_book(table, { sheet: "Giocatori" });
            XLSX.writeFile(wb, 'squadre-fantacalcio.xlsx');
        } catch (error) {
            console.error('Error downloading Excel file:', error);
            Helpers.showError('Errore nel download del file Excel');
        }
    }

    getTeamNames() {
        return this.teams;
    }

    isTeamsViewVisible() {
        return document.getElementById('teams-table') !== null;
    }
}

export default TeamsManager;