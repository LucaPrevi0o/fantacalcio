// server/services/dataService.js
//const fs = require('fs');
import fs from 'fs';

class DataService {
    constructor() {
        this.listoneFile = './json/listone.json';
        this.vendutiFile = './json/venduti.json';
        this.squadreInfoFile = './json/squadre.json';
    }

    readJsonFile(filePath, defaultValue = []) {
        if (!fs.existsSync(filePath)) {
            return defaultValue;
        }
        
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            return defaultValue;
        }
    }

    writeJsonFile(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing ${filePath}:`, error);
            return false;
        }
    }

    getGiocatori() {
        return this.readJsonFile(this.listoneFile);
    }

    getVenduti() {
        return this.readJsonFile(this.vendutiFile);
    }

    getSquadreInfo() {
        return this.readJsonFile(this.squadreInfoFile, {});
    }

    addVenduto(playerData) {
        const venduti = this.getVenduti();
        venduti.push(playerData);
        return this.writeJsonFile(this.vendutiFile, venduti);
    }

    getGiocatoriWithSoldStatus() {
        const giocatori = this.getGiocatori();
        const venduti = this.getVenduti();

        return giocatori.map(g => ({
            ...g,
            sold: venduti.some(v =>
                v.nome === g.nome &&
                v.squadra === g.squadra &&
                v.ruolo_classic === g.ruolo_classic
            )
        }));
    }

    getSquadreGrouped() {
        const venduti = this.getVenduti();
        const teamsMap = {};

        venduti.forEach(player => {
            if (!player.acquirente) return;
            if (!teamsMap[player.acquirente]) {
                teamsMap[player.acquirente] = [];
            }
            teamsMap[player.acquirente].push(player);
        });

        return Object.values(teamsMap);
    }
}

//module.exports = DataService;
export default DataService;