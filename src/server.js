import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { initializeExchanges } from './exchanges/index.js';
import { Scanner } from './core/scanner.js';
import exchangeRoutes from './api/exchanges.js';
import pairsRoutes from './api/pairs.js';
import scanRoutes from './api/scan.js';
import signalsRoutes from './api/signals.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize scanner
let scanner;
let exchanges;

// Routes
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/pairs', pairsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/signals', signalsRoutes);

// Static pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket connection
wss.on('connection', (ws) => {
  logger.info('Client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'scan') {
        // Handle scan request
        const signals = await scanner.scan(data.payload);
        ws.send(JSON.stringify({
          type: 'scan_result',
          data: signals
        }));
      }
    } catch (error) {
      logger.error('WebSocket error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    logger.info('Client disconnected');
  });
});

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  scanner?.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Initialize exchanges
    exchanges = await initializeExchanges();
    logger.info(`Initialized ${exchanges.length} exchanges`);
    
    // Create scanner
    scanner = new Scanner(exchanges);
    await scanner.start();
    
    server.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, scanner, exchanges };
