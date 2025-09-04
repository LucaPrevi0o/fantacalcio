const express = require('express');
const { chromium } = require('playwright');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static('public')); // serve file HTML e JS
app.use(express.json()); // per gestire il JSON nel body delle richieste

app.get('/api/giocatori', async (req, res) => {

    const url = "https://www.fantacalcio.it/quotazioni-fantacalcio";
    const vendutiFile = 'venduti.json';
    let venduti = [];
    if (fs.existsSync(vendutiFile)) {

        try { venduti = JSON.parse(fs.readFileSync(vendutiFile, 'utf8'));
        } catch { venduti = []; }
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {

        await page.goto(url, { waitUntil: "load", timeout: 7500 });
        await page.waitForSelector('tr.player-row');

        const giocatori = await page.$$eval('tr.player-row', (rows) => {
            return rows.map(row => {
                try {

                    const nome = row.querySelector('th.player-name span')?.innerText.trim();
                    const squadra = row.querySelector('td.player-team')?.innerText.trim();
                    const ruolo = row.querySelector('th.player-role.player-role-classic span.role')?.getAttribute('data-value').trim();
                    const quot_ini = parseInt(row.querySelector('td.player-classic-initial-price')?.innerText.trim());
                    const quot_att = parseInt(row.querySelector('td.player-classic-current-price')?.innerText.trim());
                    const fvm = parseInt(row.querySelector('td.player-classic-fvm')?.innerText.trim());

                    if (!nome || !squadra || !ruolo || isNaN(quot_ini) || isNaN(quot_att) || isNaN(fvm)) return null;

                    return { nome, squadra, ruolo_classic: ruolo, quot_ini, quot_att, fvm };
                } catch { return null; }
            }).filter(Boolean);
        });

        // Check venduti.json for sold status
        giocatori.forEach(g => {

            g.sold = venduti.some(v =>
                v.nome === g.nome &&
                v.squadra === g.squadra &&
                v.ruolo_classic === g.ruolo_classic
            );
        });

        await browser.close();
        res.json(giocatori);

    } catch (err) {

        await browser.close();
        res.status(500).send("Errore nello scraping");
        console.error(err);
    }
});

app.post('/api/venduti', (req, res) => {

    console.log('Aggiunta giocatore a venduti:', req.body);
    const vendutiFile = 'venduti.json';
    let venduti = [];
    if (fs.existsSync(vendutiFile)) {

        try { venduti = JSON.parse(fs.readFileSync(vendutiFile, 'utf8'));
        } catch { venduti = []; }
    }
    if (req.body) venduti.push(req.body);
    fs.writeFileSync(vendutiFile, JSON.stringify(venduti, null, 2));
    res.json({ success: true });
});

app.listen(PORT, () => { console.log(`Server attivo su http://localhost:${PORT}`); });
