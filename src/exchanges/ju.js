import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const JU_API_URL = 'https://api.ju.com/api/v1';

export class JuAdapter extends BaseExchangeAdapter {
  constructor() {
    super('ju', {
      baseUrl: JU_API_URL,
      makerFee: 0.2,
      takerFee: 0.2
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${JU_API_URL}/symbols`, {
        timeout: this.timeout
      });

      this.pairs = response.data.symbols.map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        pair: `${s.baseAsset}/${s.quoteAsset}`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`Ju.com: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`Ju.com getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${JU_API_URL}/depth`, {
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
      logger.error(`Ju.com getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${JU_API_URL}/ticker`, {
        params: { symbol },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(response.data.bid),
        ask: parseFloat(response.data.ask),
        lastPrice: parseFloat(response.data.lastPrice),
        volume24h: parseFloat(response.data.volume),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Ju.com getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
