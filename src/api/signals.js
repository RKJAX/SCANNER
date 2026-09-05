import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

let scannerGlobal = null;

export function setScanner(scanner) {
  scannerGlobal = scanner;
}

// GET /api/signals?limit=50
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const signals = scannerGlobal.getSignals(limit);
    
    res.json({
      success: true,
      count: signals.length,
      signals: signals
    });
  } catch (error) {
    logger.error('Error getting signals:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/signals/:index
router.get('/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const signal = scannerGlobal.getSignalDetails(index);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    res.json({
      success: true,
      signal: signal
    });
  } catch (error) {
    logger.error('Error getting signal:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
