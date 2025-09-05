// server/services/logService.js
//const fs = require('fs');
import fs from 'fs';

class LogService {
    constructor() {
        this.logDir = './log';
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFilePath() {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${this.logDir}/asta_${dateStr}.log`;
    }

    initializeLog(squadreInfo) {
        const logFile = this.getLogFilePath();
        const date = new Date().toISOString().slice(0, 10);
        
        const initLog = `Fantacalcio 2025/2026 - Gestione asta ${date}`;
        const creditsLog = `Crediti per squadra: ${squadreInfo.initial_amount || 500}`;
        const playersLog = `Numero di giocatori: ${squadreInfo.max_players || 23}`;
        
        let teamsLog = `Squadre: [\n`;
        if (Array.isArray(squadreInfo.teams)) {
            teamsLog += squadreInfo.teams.map(name => `  "${name}"`).join(',\n');
        }
        teamsLog += '\n]\n\n';

        const fullLog = [initLog, creditsLog, playersLog, teamsLog].join('\n');
        
        try {
            fs.writeFileSync(logFile, fullLog);
            console.log('Log file initialized:', logFile);
        } catch (error) {
            console.error('Error initializing log file:', error);
        }
    }

    logPlayerSale(playerData) {
        const logFile = this.getLogFilePath();
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        const logEntry = `[${timestamp}] "${playerData.acquirente}" => "${playerData.nome}" (${playerData.squadra}, ${playerData.ruolo_classic}) - ${playerData.prezzo_pagato}\n`;
        
        try {
            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }
}

//module.exports = LogService;
export default LogService;
