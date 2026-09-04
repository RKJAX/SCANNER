import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const BYBIT_API_URL = 'https://api.bybit.com/v5';
const BYBIT_WS_URL = 'wss://stream.bybit.com/v5/public/spot';

export class BybitAdapter extends BaseExchangeAdapter {
  constructor() {
    super('bybit', {
      baseUrl: BYBIT_API_URL,
      wsUrl: BYBIT_WS_URL,
      makerFee: 0.1,
      takerFee: 0.1
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${BYBIT_API_URL}/market/instruments-info`, {
        params: { category: 'spot' },
        timeout: this.timeout
      });

      this.pairs = response.data.result.list.map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseCoin,
        quoteAsset: s.quoteCoin,
        pair: `${s.baseCoin}/${s.quoteCoin}`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`Bybit: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`Bybit getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BYBIT_API_URL}/market/orderbook`, {
        params: {
          category: 'spot',
          symbol: symbol,
          limit: 100
        },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.result.b.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: response.data.result.a.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`Bybit getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BYBIT_API_URL}/market/tickers`, {
        params: {
          category: 'spot',
          symbol: symbol
        },
        timeout: this.timeout
      });

      const ticker = response.data.result.list[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.bid1Price),
        ask: parseFloat(ticker.ask1Price),
        lastPrice: parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.volume24h),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Bybit getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
