import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const BINGX_API_URL = 'https://open-api.bingx.com/openApi/spot/v1';
const BINGX_WS_URL = 'wss://open-api.bingx.com/spot/ws';

export class BingXAdapter extends BaseExchangeAdapter {
  constructor() {
    super('bingx', {
      baseUrl: BINGX_API_URL,
      wsUrl: BINGX_WS_URL,
      makerFee: 0.1,
      takerFee: 0.1
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${BINGX_API_URL}/public/products`, {
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
      logger.info(`BingX: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`BingX getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BINGX_API_URL}/public/depth`, {
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
      logger.error(`BingX getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BINGX_API_URL}/public/ticker`, {
        params: { symbol },
        timeout: this.timeout
      });

      const ticker = response.data[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.bid),
        ask: parseFloat(ticker.ask),
        lastPrice: parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.volume),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`BingX getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
