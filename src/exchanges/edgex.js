import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const EDGEX_API_URL = 'https://api.edgex.exchange/v1';
const EDGEX_WS_URL = 'wss://api.edgex.exchange/ws';

export class EdgeXAdapter extends BaseExchangeAdapter {
  constructor() {
    super('edgex', {
      baseUrl: EDGEX_API_URL,
      wsUrl: EDGEX_WS_URL,
      makerFee: 0.1,
      takerFee: 0.1
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${EDGEX_API_URL}/markets`, {
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
      logger.info(`edgeX: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`edgeX getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${EDGEX_API_URL}/depth`, {
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
      logger.error(`edgeX getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${EDGEX_API_URL}/ticker`, {
        params: { symbol },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(response.data.bid),
        ask: parseFloat(response.data.ask),
        lastPrice: parseFloat(response.data.lastPrice),
        volume24h: parseFloat(response.data.volume24h),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`edgeX getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
