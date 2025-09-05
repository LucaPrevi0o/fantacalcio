// server/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Services
import DataService from './services/dataService.js';
import LogService from './services/logService.js';

// Controllers
import GiocatoriController from './controllers/giocatoriController.js';
import SquadreController from './controllers/squadreController.js';
import SetupController from './controllers/setupController.js';

// Routes
import giocatoriRoutes from './routes/giocatori.js';
import squadreRoutes from './routes/squadre.js';
import setupRoutes from './routes/setup.js';

// Middleware
import errorHandler from './middleware/errorHandler.js';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Server {
    constructor() {
        this.app = express();
        this.PORT = process.env.PORT || 3000;
        
        // Initialize services
        this.dataService = new DataService();
        this.logService = new LogService();
        
        // Initialize controllers
        this.giocatoriController = new GiocatoriController(this.dataService);
        this.squadreController = new SquadreController(this.dataService, this.logService);
        this.setupController = new SetupController(this.dataService);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Parse JSON bodies
        this.app.use(express.json());
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // API routes
        this.app.use('/api/giocatori', giocatoriRoutes(this.giocatoriController));
        this.app.use('/api/squadre', squadreRoutes(this.squadreController));
        //this.app.use('/api/venduti', squadreRoutes(this.squadreController)); // Legacy route
        this.app.use('/api/setup', setupRoutes(this.setupController));
        
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });
        
        // Catch-all for SPA
        /*this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });*/
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    start() {
        console.log('Starting server...');
        this.app.listen(this.PORT, () => {
            console.log(`Server running on http://localhost:${this.PORT}`);
            
            // Initialize log file
            const squadreInfo = this.dataService.getSquadreInfo();
            this.logService.initializeLog(squadreInfo);
        });
    }
}

// Start server if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const server = new Server();
    server.start();
} else console.log('Server module imported, not starting server automatically.');

export default Server;