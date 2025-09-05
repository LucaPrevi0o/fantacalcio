// server/routes/squadre.js
import express from 'express';
const router = express.Router();

export default (squadreController) => {
    router.get('/', squadreController.getSquadre.bind(squadreController));
    router.post('/', squadreController.addVenduto.bind(squadreController)); // <-- changed from '/venduti' to '/'
    return router;
};