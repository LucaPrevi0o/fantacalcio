// server/routes/setup.js
//const express = require('express');
import express from 'express';
const router = express.Router();

export default (setupController) => {
    router.get('/', setupController.getSetup.bind(setupController));
    
    return router;
};