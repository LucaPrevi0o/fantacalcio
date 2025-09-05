// server/controllers/squadreController.js
class SquadreController {
    constructor(dataService, logService) {
        this.dataService = dataService;
        this.logService = logService;
    }

    async getSquadre(req, res) {
        try {
            const squadre = this.dataService.getSquadreGrouped();
            res.json(squadre);
        } catch (error) {
            console.error('Error in getSquadre:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async addVenduto(req, res) {
        try {
            const playerData = req.body;
            
            if (!playerData || !playerData.acquirente || !playerData.nome) {
                return res.status(400).json({ error: 'Missing required player data' });
            }

            const success = this.dataService.addVenduto(playerData);
            
            if (success) {
                this.logService.logPlayerSale(playerData);
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to save player data' });
            }
        } catch (error) {
            console.error('Error in addVenduto:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

//module.exports = SquadreController;
export default SquadreController;