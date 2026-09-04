import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const OKX_API_URL = 'https://www.okx.com/api/v5';
const OKX_WS_URL = 'wss://ws.okx.com:8443/ws/v5/public';

export class OKXAdapter extends BaseExchangeAdapter {
  constructor() {
    super('okx', {
      baseUrl: OKX_API_URL,
      wsUrl: OKX_WS_URL,
      makerFee: 0.1,
      takerFee: 0.15
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${OKX_API_URL}/market/instruments`, {
        params: { instType: 'SPOT' },
        timeout: this.timeout
      });

      this.pairs = response.data.data.map(s => {
        const [base, quote] = s.instId.split('-');
        return {
          symbol: s.instId,
          baseAsset: base,
          quoteAsset: quote,
          pair: `${base}/${quote}`
        };
      });

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`OKX: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`OKX getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${OKX_API_URL}/market/books`, {
        params: {
          instId: symbol,
          sz: 100
        },
        timeout: this.timeout
      });

      const book = response.data.data[0];
      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: book.bids.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: book.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: parseInt(book.ts)
      });
    } catch (error) {
      logger.error(`OKX getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${OKX_API_URL}/market/ticker`, {
        params: { instId: symbol },
        timeout: this.timeout
      });

      const ticker = response.data.data[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.bidPx),
        ask: parseFloat(ticker.askPx),
        lastPrice: parseFloat(ticker.last),
        volume24h: parseFloat(ticker.vol24h),
        timestamp: parseInt(ticker.ts)
      };
    } catch (error) {
      logger.error(`OKX getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
