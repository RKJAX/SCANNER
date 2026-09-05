import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const OURBIT_API_URL = 'https://api.ourbit.com/api/v1';

export class OurbitAdapter extends BaseExchangeAdapter {
  constructor() {
    super('ourbit', {
      baseUrl: OURBIT_API_URL,
      makerFee: 0.15,
      takerFee: 0.15
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${OURBIT_API_URL}/common/symbols`, {
        timeout: this.timeout
      });

      this.pairs = response.data.data.map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        pair: `${s.baseAsset}/${s.quoteAsset}`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`Ourbit: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`Ourbit getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${OURBIT_API_URL}/market/depth`, {
        params: {
          symbol: symbol,
          limit: 100
        },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.data.bids.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: response.data.data.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`Ourbit getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${OURBIT_API_URL}/market/ticker`, {
        params: { symbol },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(response.data.data.bid),
        ask: parseFloat(response.data.data.ask),
        lastPrice: parseFloat(response.data.data.lastPrice),
        volume24h: parseFloat(response.data.data.volume24h),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Ourbit getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
