import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const BITMART_API_URL = 'https://api.bitmart.com/v2';
const BITMART_WS_URL = 'wss://ws-manager-compress.bitmart.com/api/spot/v1';

export class BitMartAdapter extends BaseExchangeAdapter {
  constructor() {
    super('bitmart', {
      baseUrl: BITMART_API_URL,
      wsUrl: BITMART_WS_URL,
      makerFee: 0.25,
      takerFee: 0.25
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${BITMART_API_URL}/symbols/details`, {
        timeout: this.timeout
      });

      this.pairs = response.data.data.symbols
        .filter(s => s.trade_status === 'trading')
        .map(s => ({
          symbol: s.symbol,
          baseAsset: s.base_currency,
          quoteAsset: s.quote_currency,
          pair: `${s.base_currency}/${s.quote_currency}`
        }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`BitMart: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`BitMart getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BITMART_API_URL}/book`, {
        params: {
          symbol: symbol,
          precision: 2
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
      logger.error(`BitMart getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BITMART_API_URL}/ticker`, {
        params: { symbol },
        timeout: this.timeout
      });

      const ticker = response.data.data.ticker[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.best_bid),
        ask: parseFloat(ticker.best_ask),
        lastPrice: parseFloat(ticker.last_price),
        volume24h: parseFloat(ticker.base_volume_24h),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`BitMart getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
