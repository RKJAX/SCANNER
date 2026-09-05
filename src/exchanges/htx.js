import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const HTX_API_URL = 'https://api.huobi.pro';
const HTX_WS_URL = 'wss://api.huobi.pro';

export class HTXAdapter extends BaseExchangeAdapter {
  constructor() {
    super('htx', {
      baseUrl: HTX_API_URL,
      wsUrl: HTX_WS_URL,
      makerFee: 0.2,
      takerFee: 0.2
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${HTX_API_URL}/v1/common/symbols`, {
        timeout: this.timeout
      });

      this.pairs = response.data.data.map(s => ({
        symbol: s['trade-partition'] === 'innovation' ? null : s['symbol'],
        baseAsset: s['base-currency'].toUpperCase(),
        quoteAsset: s['quote-currency'].toUpperCase(),
        pair: `${s['base-currency'].toUpperCase()}/${s['quote-currency'].toUpperCase()}`
      })).filter(p => p.symbol);

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`HTX: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`HTX getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${HTX_API_URL}/market/depth`, {
        params: {
          symbol: symbol,
          type: 'step0'
        },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.tick.bids.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: response.data.tick.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: response.data.tick.ts
      });
    } catch (error) {
      logger.error(`HTX getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${HTX_API_URL}/market/trade`, {
        params: { symbol },
        timeout: this.timeout
      });

      const ticker = response.data.tick.data[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.bid),
        ask: parseFloat(ticker.ask),
        lastPrice: parseFloat(ticker.price),
        volume24h: 0,
        timestamp: response.data.tick.ts
      };
    } catch (error) {
      logger.error(`HTX getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
