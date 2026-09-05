import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const XT_API_URL = 'https://api.xt.com/v4';
const XT_WS_URL = 'wss://stream.xt.com/public';

export class XTAdapter extends BaseExchangeAdapter {
  constructor() {
    super('xt', {
      baseUrl: XT_API_URL,
      wsUrl: XT_WS_URL,
      makerFee: 0.2,
      takerFee: 0.2
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${XT_API_URL}/public/symbols`, {
        timeout: this.timeout
      });

      this.pairs = response.data.result.map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        pair: `${s.baseAsset}/${s.quoteAsset}`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`XT.com: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`XT.com getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${XT_API_URL}/public/depth`, {
        params: {
          symbol: symbol,
          limit: 100
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
      logger.error(`XT.com getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${XT_API_URL}/public/ticker`, {
        params: { symbol },
        timeout: this.timeout
      });

      const ticker = response.data.result[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.bid),
        ask: parseFloat(ticker.ask),
        lastPrice: parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.baseVolume),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`XT.com getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
