// server/routes/giocatori.js
//const express = require('express');
import express from 'express';
const router = express.Router();

export default (giocatoriController) => {
    router.get('/', giocatoriController.getGiocatori.bind(giocatoriController));
    
    return router;
};