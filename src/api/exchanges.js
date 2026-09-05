import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

let exchangesGlobal = [];

export function setExchanges(exchanges) {
  exchangesGlobal = exchanges;
}

// GET /api/exchanges
router.get('/', async (req, res) => {
  try {
    const exchangeData = exchangesGlobal.map(ex => ({
      name: ex.name,
      status: ex.getStatus(),
      lastUpdate: ex.lastUpdate,
      pairsLoaded: ex.pairs?.length || 0,
      makerFee: ex.makerFee,
      takerFee: ex.takerFee,
      website: getExchangeWebsite(ex.name)
    }));

    res.json({
      success: true,
      total: exchangeData.length,
      exchanges: exchangeData
    });
  } catch (error) {
    logger.error('Error getting exchanges:', error);
    res.status(500).json({ error: error.message });
  }
});

function getExchangeWebsite(name) {
  const websites = {
    binance: 'https://www.binance.com',
    bybit: 'https://www.bybit.com',
    okx: 'https://www.okx.com',
    bitget: 'https://www.bitget.com',
    kucoin: 'https://www.kucoin.com',
    gate: 'https://www.gate.io',
    bingx: 'https://www.bingx.com',
    mexc: 'https://www.mexc.com',
    htx: 'https://www.htx.com',
    hyperliquid: 'https://www.hyperliquid.xyz',
    aster: 'https://www.asterdex.com',
    ourbit: 'https://www.ourbit.com',
    bitmart: 'https://www.bitmart.com',
    xt: 'https://www.xt.com',
    ju: 'https://www.ju.com',
    kcex: 'https://www.kcex.com',
    levex: 'https://www.levex.com',
    edgex: 'https://www.edgex.exchange'
  };
  return websites[name] || '#';
}

export default router;
