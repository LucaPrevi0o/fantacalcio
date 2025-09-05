let giocatori = [];
let currentPlayer = null;

// Asta button logic
const btnAsta = document.getElementById('btnAsta');
let astaInterval = null;
let beepFreq = null;
let astaTimeLeft = 0;

let maxCredits = 0;
let numPlayers = 0;
let teams = [];

// Submit on ENTER in either input
function submitVenduto(buyerSelect, priceInput) {

    if (buyerSelect.value && priceInput.value.trim() !== '') {

        const playerData = {
            ...currentPlayer,
            acquirente: buyerSelect.value,
            prezzo_pagato: priceInput.value.trim()
        };
        fetch('/api/venduti', {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(playerData)
        }).then(() => { window.location.reload(); });
    }
}

btnAsta.addEventListener('click', function () {

    // Always restart the timer on click
    if (astaInterval) clearInterval(astaInterval);
    astaTimeLeft = 6;
    beepFreq = 440; // Set default frequency to 440Hz
    playBeep(beepFreq); // Play beep every second
    btnAsta.textContent = astaTimeLeft + 's';
    btnAsta.classList.remove('yellow', 'red');
    btnAsta.disabled = false;

    // Disable the button to switch view and search filters when timer starts
    document.getElementById('vediSquadreBtn').disabled = true;
    document.getElementById('ruoloSelect').disabled = true;
    document.getElementById('searchInput').disabled = true;

    // Set up the interval to count down every second
    astaInterval = setInterval(() => {

        astaTimeLeft--; // Decrement time left

        // Color changes
        if (astaTimeLeft <= 4 && astaTimeLeft > 2) {

            beepFreq = 880; // Change frequency to 880Hz
            btnAsta.classList.add('yellow');
        } else if (astaTimeLeft <= 2 && astaTimeLeft > 0) {

            beepFreq = 1320; // Change frequency to 1320Hz
            btnAsta.classList.add('red');
            btnAsta.classList.remove('yellow');
        } else if (astaTimeLeft <= 0) {

            clearInterval(astaInterval);
            btnAsta.textContent = 'Tempo scaduto!';
            btnAsta.classList.remove('yellow', 'red');
            btnAsta.disabled = true;

            const astaBoxInner = btnAsta.parentNode;
            astaBoxInner.classList.add('asta-ended');

            let inputContainer = document.createElement('div');
            inputContainer.className = 'vendita-input-container';

            let teamNames = (teams || []).filter(t => t && t.trim() !== '');
            if (teamNames.length === 0) 
                teamNames = Array.from({ length: 12 }, (_, i) => `Squadra ${i + 1}`);

            let buyerSelect = document.createElement('select');
            buyerSelect.className = 'buyer-input';
            buyerSelect.required = true;
            buyerSelect.innerHTML = teamNames.map(name => `<option value="${name}">${name}</option>`).join('');

            let priceInput = document.createElement('input');
            priceInput.type = 'number';
            priceInput.placeholder = 'Prezzo';
            priceInput.className = 'price-input';
            priceInput.min = 1;
            priceInput.max = 500;

            inputContainer.appendChild(buyerSelect);
            inputContainer.appendChild(priceInput);
            astaBoxInner.appendChild(inputContainer);

            buyerSelect.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') submitVenduto(buyerSelect, priceInput);
            });
            priceInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') submitVenduto(buyerSelect, priceInput);
            });

            return;
        }
        btnAsta.textContent = astaTimeLeft + 's';
        playBeep(beepFreq); // Play beep every second
    }, 1000);
});

// Beep sound function
function playBeep(frequency) {

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency || 1000;
    oscillator.connect(ctx.destination);
    oscillator.start();
    setTimeout(() => {

        oscillator.stop();
        ctx.close();
    }, 80); // 80ms beep
}

// Get role info based on ruolo code
function getRoleInfo(ruolo) {

    switch (ruolo) {

        case 'p': return { cls: 'role-gk', letter: 'P', label: 'Portiere' };
        case 'd': return { cls: 'role-df', letter: 'D', label: 'Difensore' };
        case 'c': return { cls: 'role-mf', letter: 'C', label: 'Centrocampista' };
        case 'a': return { cls: 'role-st', letter: 'A', label: 'Attaccante' };
        default: return { cls: '', letter: '', label: '' };
    }
}

// Load giocatori data from server
async function caricaGiocatori() {

    // Show loading message in the button
    btnAsta.textContent = 'Caricamento...';
    btnAsta.disabled = true;

    const tbody = document.querySelector('#giocatori-table tbody');
    tbody.innerHTML = '';

    try {

        // Fetch giocatori.json data
        const res = await fetch('/api/giocatori');
        giocatori = await res.json();
        btnAsta.textContent = 'Inizia asta';
        btnAsta.disabled = false;
        mostraGiocatori();
    } catch (err) {

        btnAsta.textContent = 'Errore dati';
        btnAsta.disabled = true;
        tbody.innerHTML = `<tr><td colspan="6" class="errore-dati">Errore nel caricamento dei dati</td></tr>`;
    }
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function mostraGiocatori(autoSwitchToTeams = false) {

    const ruolo = document.getElementById('ruoloSelect').value;
    const search = document.getElementById('searchInput').value.trim().toLowerCase();
    const tbody = document.querySelector('#giocatori-table tbody');
    tbody.innerHTML = '';

    const filtered = giocatori
        .filter(g => (!ruolo || g.ruolo_classic === ruolo) &&
            (!search || (g.nome && g.nome.toLowerCase().includes(search))));

    // Show info about the current player
    const infoDiv = document.getElementById('current-player-info');
    const btnAsta = document.getElementById('btnAsta');

    if (currentPlayer) {
        const g = currentPlayer;
        const roleInfo = getRoleInfo(g.ruolo_classic);

        // Stats box HTML
        const statsBox = `
            <div class="giocatore-stats-box">
                <h3>Statistiche stagione 2024/2025</h3>
                <div class="giocatore-stats-row">
                    <div class="stat-box">
                        <span class="stat-label">Presenze</span>
                        <span class="stat-val">${g.presenze ?? '-'}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Media &nbsp;|&nbsp; Fantamedia</span>
                        <span class="stat-val">
                          ${typeof g.media_voto === 'number' ? g.media_voto.toFixed(2).replace(',', '.') : (g.media_voto ?? '-')}
                          &nbsp;&nbsp;|&nbsp;&nbsp;
                          ${typeof g.fanta_media === 'number' ? g.fanta_media.toFixed(2).replace(',', '.') : (g.fanta_media ?? '-')}
                        </span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">${
                                g.ruolo_classic === 'p'
                                    ? "Gol subiti" // Show taken goals for goalkeepers
                                    : "Gol"
                            } &nbsp;|&nbsp; Assist</span>
                        <span class="stat-val">
                            ${
                                g.ruolo_classic === 'p'
                                    ? (g.gol_subiti ?? '-') // Show taken goals for goalkeepers
                                    : (g.gol ?? '-')
                            }
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            ${g.assist ?? '-'}
                        </span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Rigori</span>
                        <span class="stat-val">${g.rigori_fatti ?? '-'}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">AMM - ESP</span>
                        <span class="stat-val">${g.ammonizioni ?? '-'} - ${g.espulsioni ?? '-'}</span>
                    </div>
                </div>
            </div>
        `;

        infoDiv.innerHTML = `
            <div class="giocatore-nome">
                <span class="giocatore-attuale-label">Giocatore attuale:</span> ${g.nome}
            </div>
            <div class="giocatore-ruolo-team">
                <span class="role-box ${roleInfo.cls}" title="${roleInfo.label}">${roleInfo.letter}</span>
                <span>${roleInfo.label}</span>
                <span class="giocatore-squadra">${g.squadra}</span>
            </div>
            <div class="giocatore-prezzi">
                <div class="prezzo-box">
                    <span class="prezzo-label">Quotazione iniziale</span>
                    <span class="prezzo-val">${g.quot_ini}</span>
                </div>
                <div class="prezzo-box">
                    <span class="prezzo-label">Quotazione attuale</span>
                    <span class="prezzo-val">${g.quot_att}</span>
                </div>
                <div class="prezzo-box">
                    <span class="prezzo-label">FVM / 1000</span>
                    <span class="prezzo-val">${g.fvm}</span>
                </div>
            </div>
            ${statsBox}
        `;
        btnAsta.disabled = false;

        // Automatically switch to teams table if requested and not already visible
        if (autoSwitchToTeams && !document.getElementById('teams-table')) {

            const event = new Event('click');
            event.autoSwitch = true;
            document.getElementById('vediSquadreBtn').dispatchEvent(event);
        }
    } else {

        infoDiv.innerHTML = `<span class="giocatore-non-trovato">Nessun giocatore selezionato.</span>`;
        btnAsta.disabled = true;
    }

    filtered.forEach((g, idx) => {

        const roleInfo = getRoleInfo(g.ruolo_classic);
        const tr = document.createElement('tr');
        if (g.sold === true) tr.classList.add('player-sold');

        // If sold, render as span (not link), else as link
        const nameCell = g.sold
            ? `<span class="giocatore-link giocatore-sold" data-index="${idx}">${g.nome}</span>`
            : `<a href="#giocatore-attuale" class="giocatore-link" data-index="${idx}">${g.nome}</a>`;

        tr.innerHTML = `
            <td><span class="role-box ${roleInfo.cls}">${roleInfo.letter}</span></td>
            <td>${nameCell}</td>
            <td>${g.squadra}</td>
            <td>${g.quot_ini}</td>
            <td>${g.quot_att}</td>
            <td>${g.fvm}</td>`;
        tbody.appendChild(tr);
    });

    // Add click event to player names
    document.querySelectorAll('.giocatore-link').forEach(link => {
        link.addEventListener('click', function (e) {

            e.preventDefault();
            const idx = parseInt(this.getAttribute('data-index'));
            currentPlayer = filtered[idx];
            mostraGiocatori(); // update info box and enable Asta button
            scrollToTop();

            // Switch to teams view if not already visible
            if (!document.getElementById('teams-table')) {

                const event = new Event('click');
                event.autoSwitch = true;
                document.getElementById('vediSquadreBtn').dispatchEvent(event);
            }
        });
    });
}

document.getElementById('ruoloSelect').addEventListener('change', () => mostraGiocatori(true));
document.getElementById('searchInput').addEventListener('input', () => mostraGiocatori(true));

caricaGiocatori();

document.getElementById('vediSquadreBtn').addEventListener('click', async function (e) {

    const giocatoriTable = document.getElementById('giocatori-table');
    const downloadBtn = document.getElementById('download-xlsx-btn');
    let teamsTable = document.getElementById('teams-table');
    const btn = this;

    // Only reset currentPlayer if this is a manual switch (not auto from player selection)
    if (!e || !e.autoSwitch) {
        if (currentPlayer) {

            currentPlayer = null;
            mostraGiocatori();
        }
    }

    if (teamsTable) {

        teamsTable.remove();
        giocatoriTable.style.display = '';
        btn.textContent = 'Vedi squadre';
        downloadBtn.style.display = 'none';
    } else {

        giocatoriTable.style.display = 'none';
        downloadBtn.style.display = 'block';

        // Fetch venduti.json data
        let teamsArray = [];
        try {
            const res = await fetch('/api/squadre');
            teamsArray = await res.json();
        } catch (err) { teamsArray = []; }

        console.log('Squadre:', teamsArray);

        // Create new table with 12 columns (each team gets 3 columns: ruolo, nome, prezzo)
        teamsTable = document.createElement('table');
        teamsTable.id = 'teams-table';

        // Table header
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        for (let i = 0; i < teams.length; i++) {

            const th = document.createElement('th');
            th.textContent = teams[i];
            th.colSpan = 3;
            trHead.appendChild(th);
        }
        thead.appendChild(trHead);

        // Second row: credits remaining and max price per player
        const trCredits = document.createElement('tr');
        for (let i = 0; i < teams.length; i++) {

            const players = teamsArray[i] || [];
            const totalSpent = players.reduce((sum, p) => sum + (parseInt(p.prezzo_pagato) || 0), 0);
            const creditsLeft = maxCredits - totalSpent;
            const playersBought = players.length;
            const playersToBuy = numPlayers - playersBought;
            const maxPrice = playersToBuy > 0 ? creditsLeft - (playersToBuy - 1) : 0;

            const td = document.createElement('td');
            td.colSpan = 3;
            td.style.padding = '0';

            // Create inner table
            const innerTable = document.createElement('table');
            innerTable.style.width = '100%';
            innerTable.style.borderCollapse = 'collapse';

            const innerTr = document.createElement('tr');

            const tdCredits = document.createElement('td');
            tdCredits.textContent = `${creditsLeft}`;
            tdCredits.style.fontWeight = 'bold';
            tdCredits.style.textAlign = 'center';
            tdCredits.style.borderRight = '1px solid #ccc';
            tdCredits.style.background = '#ffd600'; // yellow

            const tdMaxPrice = document.createElement('td');
            tdMaxPrice.textContent = `${maxPrice}`;
            tdMaxPrice.style.fontWeight = 'bold';
            tdMaxPrice.style.textAlign = 'center';
            tdMaxPrice.style.background = '#85f374ff'; // green

            innerTr.appendChild(tdCredits);
            innerTr.appendChild(tdMaxPrice);
            innerTable.appendChild(innerTr);

            td.appendChild(innerTable);
            trCredits.appendChild(td);
        }
        thead.appendChild(trCredits);

        teamsTable.appendChild(thead);

        // Table body: fill each team with rows, each row has 3 cells per team (role, name, price)
        //const maxPlayers = Math.max(...teamsArray.map(arr => arr.length), 1);

        const tbody = document.createElement('tbody');

        // Find the max number of players bought by any team
        const maxPlayers = Math.max(
            ...teams.map(teamName =>
                (teamsArray.find(arr => arr.length && arr[0].acquirente === teamName) || []).length
            ),
            1
        );

        for (let row = 0; row < maxPlayers; row++) {
            const tr = document.createElement('tr');
            for (let col = 0; col < teams.length; col++) {
                const teamName = teams[col];
                // Find all players for this team
                const players = teamsArray
                    .find(arr => arr.length && arr[0].acquirente === teamName) || [];
                const player = players[row];

                // Role
                const tdRole = document.createElement('td');
                if (player) {
                    const roleInfo = getRoleInfo(player.ruolo_classic);
                    tdRole.innerHTML = `<span class="role-box ${roleInfo.cls}">${roleInfo.letter}</span>`;
                } else tdRole.textContent = '';
                tr.appendChild(tdRole);

                // Name
                const tdName = document.createElement('td');
                tdName.textContent = player ? player.nome : '';
                tr.appendChild(tdName);

                // Price
                const tdPrice = document.createElement('td');
                tdPrice.textContent = player ? player.prezzo_pagato : '';
                tr.appendChild(tdPrice);
            }
            tbody.appendChild(tr);
        }
        teamsTable.appendChild(tbody);
        giocatoriTable.parentNode.insertBefore(teamsTable, giocatoriTable.nextSibling);
        btn.textContent = 'Lista giocatori';
    }
});

document.getElementById('download-xlsx-btn').addEventListener('click', function () {
    const table = document.getElementById('teams-table');
    const wb = XLSX.utils.table_to_book(table, {sheet: "Giocatori"});
    XLSX.writeFile(wb, 'table.xlsx');
});

async function getSetupData() {
    try {

        const res = await fetch('/api/setup');
        if (!res.ok) throw new Error('Errore nel caricamento delle impostazioni');
        const setup = await res.json();

        maxCredits = setup.initial_amount || 0;
        numPlayers = setup.max_players || 0;
        teams = setup.teams || [];
        return setup;
    } catch (err) {

        console.error(err);
        return null;
    }
}

// Example: use setup data to get team names
getSetupData().then(setup => {
    if (setup && Array.isArray(setup.teamNames)) {
        // Use setup.teamNames for your dropdown, table headers, etc.
        console.log(setup.teamNames);
    }
});