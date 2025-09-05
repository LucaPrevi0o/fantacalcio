// server/controllers/setupController.js
class SetupController {
    constructor(dataService) {
        this.dataService = dataService;
    }

    async getSetup(req, res) {
        try {
            const squadreInfo = this.dataService.getSquadreInfo();
            res.json(squadreInfo);
        } catch (error) {
            console.error('Error in getSetup:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

//module.exports = SetupController;
export default SetupController;