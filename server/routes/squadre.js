// server/routes/squadre.js
import express from 'express';
const router = express.Router();

export default (squadreController) => {
    router.get('/', squadreController.getSquadre.bind(squadreController));
    router.post('/venduti', squadreController.addVenduto.bind(squadreController));
    return router;
};