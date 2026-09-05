import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const LEVEX_API_URL = 'https://api.levex.com/v1';

export class LeveXAdapter extends BaseExchangeAdapter {
  constructor() {
    super('levex', {
      baseUrl: LEVEX_API_URL,
      makerFee: 0.1,
      takerFee: 0.1
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${LEVEX_API_URL}/public/instruments`, {
        timeout: this.timeout
      });

      this.pairs = response.data.result.map(s => ({
        symbol: s.instrumentName,
        baseAsset: s.baseCurrency,
        quoteAsset: s.quoteCurrency,
        pair: `${s.baseCurrency}/${s.quoteCurrency}`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`LeveX: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`LeveX getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${LEVEX_API_URL}/public/get_order_book`, {
        params: {
          instrument_name: symbol,
          depth: 100
        },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.result.bids.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: response.data.result.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`LeveX getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${LEVEX_API_URL}/public/ticker`, {
        params: { instrument_name: symbol },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(response.data.result.best_bid_price),
        ask: parseFloat(response.data.result.best_ask_price),
        lastPrice: parseFloat(response.data.result.last_price),
        volume24h: parseFloat(response.data.result.stats.volume),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`LeveX getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
