import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const BITGET_API_URL = 'https://api.bitget.com/spot/v1';
const BITGET_WS_URL = 'wss://ws.bitget.com/spot/v1/public';

export class BitgetAdapter extends BaseExchangeAdapter {
  constructor() {
    super('bitget', {
      baseUrl: BITGET_API_URL,
      wsUrl: BITGET_WS_URL,
      makerFee: 0.1,
      takerFee: 0.1
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${BITGET_API_URL}/public/products`, {
        timeout: this.timeout
      });

      this.pairs = response.data.data.map(s => ({
        symbol: s.symbolName,
        baseAsset: s.baseCoin,
        quoteAsset: s.quoteCoin,
        pair: `${s.baseCoin}/${s.quoteCoin}`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`Bitget: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`Bitget getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BITGET_API_URL}/public/depth`, {
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
      logger.error(`Bitget getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BITGET_API_URL}/public/ticker`, {
        params: { symbol },
        timeout: this.timeout
      });

      const ticker = response.data.data[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.buy),
        ask: parseFloat(ticker.sell),
        lastPrice: parseFloat(ticker.last),
        volume24h: parseFloat(ticker.baseVol),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Bitget getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
