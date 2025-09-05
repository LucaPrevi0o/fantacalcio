// server/controllers/giocatoriController.js
class GiocatoriController {
    constructor(dataService) {
        this.dataService = dataService;
    }

    async getGiocatori(req, res) {
        try {
            const giocatori = this.dataService.getGiocatoriWithSoldStatus();
            res.json(giocatori);
        } catch (error) {
            console.error('Error in getGiocatori:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

//module.exports = GiocatoriController;
export default GiocatoriController;