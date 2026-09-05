import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

let exchangesGlobal = [];

export function setExchanges(exchanges) {
  exchangesGlobal = exchanges;
}

// GET /api/pairs?exchanges=binance,bybit
router.get('/', async (req, res) => {
  try {
    const exchangeNames = (req.query.exchanges || '').split(',').map(e => e.trim().toLowerCase()).filter(e => e);
    
    if (exchangeNames.length === 0) {
      return res.status(400).json({ error: 'Specify exchanges parameter' });
    }

    const selectedExchanges = exchangesGlobal.filter(ex => exchangeNames.includes(ex.name.toLowerCase()));
    
    if (selectedExchanges.length === 0) {
      return res.status(400).json({ error: 'No valid exchanges found' });
    }

    // Load pairs for each exchange
    const pairMap = new Map();

    for (const exchange of selectedExchanges) {
      try {
        if (!exchange.pairs || exchange.pairs.length === 0) {
          await exchange.getPairs();
        }
        
        exchange.pairs.forEach(p => {
          const key = p.pair.toUpperCase();
          if (!pairMap.has(key)) {
            pairMap.set(key, {
              pair: p.pair,
              exchanges: []
            });
          }
          pairMap.get(key).exchanges.push(exchange.name);
        });
      } catch (error) {
        logger.error(`Error loading pairs from ${exchange.name}: ${error.message}`);
      }
    }

    // Return only pairs available on all selected exchanges (or most of them)
    const pairs = Array.from(pairMap.values())
      .filter(p => p.exchanges.length >= Math.ceil(selectedExchanges.length / 2))
      .map(p => p.pair)
      .sort();

    res.json({
      success: true,
      total: pairs.length,
      pairs: pairs
    });
  } catch (error) {
    logger.error('Error getting pairs:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
