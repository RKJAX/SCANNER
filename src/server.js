import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initializeExchanges } from './exchanges/index.js';
import { Scanner } from './core/scanner.js';
import exchangeRoutes, { setExchanges as setExchangesForRoute } from './api/exchanges.js';
import pairsRoutes, { setExchanges as setExchangesForPairs } from './api/pairs.js';
import scanRoutes, { setScanner as setScannerForRoute } from './api/scan.js';
import signalsRoutes, { setScanner as setScannerForSignals } from './api/signals.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    logger.info(`✅ Initialized ${exchanges.length} exchanges`);
    
    // Set exchanges for API routes
    setExchangesForRoute(exchanges);
    setExchangesForPairs(exchanges);
    
    // Create scanner
    scanner = new Scanner(exchanges);
    await scanner.start();
    
    // Set scanner for API routes
    setScannerForRoute(scanner);
    setScannerForSignals(scanner);
    
    server.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
      logger.info(`📊 Scanner ready with ${exchanges.length} exchanges`);
      logger.info(`🌐 Open http://localhost:${PORT} in your browser`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, scanner, exchanges };
