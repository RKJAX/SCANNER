import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const MEXC_API_URL = 'https://api.mexc.com/api/v3';
const MEXC_WS_URL = 'wss://wbs.mexc.com/raw/ws';

export class MEXCAdapter extends BaseExchangeAdapter {
  constructor() {
    super('mexc', {
      baseUrl: MEXC_API_URL,
      wsUrl: MEXC_WS_URL,
      makerFee: 0.2,
      takerFee: 0.2
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${MEXC_API_URL}/exchangeInfo`, {
        timeout: this.timeout
      });

      this.pairs = response.data.symbols
        .filter(s => s.status === 'TRADING')
        .map(s => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          pair: `${s.baseAsset}/${s.quoteAsset}`
        }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`MEXC: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`MEXC getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${MEXC_API_URL}/depth`, {
        params: {
          symbol: symbol,
          limit: 100
        },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.bids.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: response.data.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`MEXC getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${MEXC_API_URL}/ticker/24hr`, {
        params: { symbol },
        timeout: this.timeout
      });

      const ticker = response.data;
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.bidPrice),
        ask: parseFloat(ticker.askPrice),
        lastPrice: parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.volume),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`MEXC getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
