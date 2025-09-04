const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
const logFile = `./log/asta_${dateStr}.log`;

const listoneFile = './json/listone.json';
const vendutiFile = './json/venduti.json';
const squadreInfoFile = './json/squadre.json';

app.use(express.static('public')); // serve file HTML e JS
app.use(express.json()); // per gestire il JSON nel body delle richieste

// Utility to read JSON file safely as array
function getDataArray(fileName) {

    if (fs.existsSync(fileName))
        try { return JSON.parse(fs.readFileSync(fileName, 'utf8')); }
        catch { return []; }
}

// Utility to read JSON file safely as object
function getDataObject(fileName) {

    if (fs.existsSync(fileName))
        try { return JSON.parse(fs.readFileSync(fileName, 'utf8')); }
        catch { return {}; }
}

app.get('/api/giocatori', async (req, res) => {

    let venduti = getDataArray(vendutiFile);
    let giocatori = getDataArray(listoneFile);

    // Add sold status
    giocatori.forEach(g => {
        g.sold = venduti.some(v =>
            v.nome === g.nome &&
            v.squadra === g.squadra &&
            v.ruolo_classic === g.ruolo_classic
        );
    });

    res.json(giocatori);
});

app.get('/api/squadre', (req, res) => {

    let venduti = getDataArray(vendutiFile);

    // Group players by acquirente
    const teamsMap = {};
    venduti.forEach(player => {

        if (!player.acquirente) return;
        if (!teamsMap[player.acquirente]) teamsMap[player.acquirente] = [];
        teamsMap[player.acquirente].push(player);
    });

    // Convert to array of arrays
    const teamsArray = Object.values(teamsMap);
    res.json(teamsArray);
});

app.post('/api/venduti', (req, res) => {

    let venduti = getDataArray(vendutiFile);

    if (req.body) venduti.push(req.body);
    fs.writeFileSync(vendutiFile, JSON.stringify(venduti, null, 2));

    // Append log entry
    if (req.body) {

        const logEntry = `[${new Date().toISOString().slice(0, 19).replace('T', ' ')}] "${req.body.acquirente}" => "${req.body.nome}" (${req.body.squadra}, ${req.body.ruolo_classic}) - ${req.body.prezzo_pagato}\n`;
        fs.appendFileSync(logFile, logEntry);
    }

    res.json({ success: true });
});

app.get('/api/setup', (req, res) => { res.json(getDataObject(squadreInfoFile)); });

app.listen(PORT, () => { 
    
    console.log(`Server attivo su http://localhost:${PORT}`);
    let squadreInfo = getDataObject(squadreInfoFile);

    const initLog = `Fantacalcio 2025/2026 - Gestione asta ${new Date().toISOString().slice(0,10)}`;
    const creditsLog = `Crediti per squadra: ${squadreInfo.initial_amount}`;
    const playersLog = `Numero di giocatori: ${squadreInfo.max_players}`;
    
    let teamsLog = `Squadre: [\n`;
    if (Array.isArray(squadreInfo.teams))
        teamsLog += squadreInfo.teams.map(name => `  "${name}"`).join(',\n');

    fs.writeFileSync(logFile, initLog + '\n');
    fs.appendFileSync(logFile, creditsLog + '\n');
    fs.appendFileSync(logFile, playersLog + '\n');
    fs.appendFileSync(logFile, teamsLog + '\n]\n\n');
});
