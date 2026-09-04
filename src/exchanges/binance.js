import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

export class BinanceAdapter extends BaseExchangeAdapter {
  constructor() {
    super('binance', {
      baseUrl: BINANCE_API_URL,
      wsUrl: BINANCE_WS_URL,
      makerFee: 0.1,  // 0.1% default
      takerFee: 0.1   // 0.1% default
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${BINANCE_API_URL}/exchangeInfo`, {
        timeout: this.timeout
      });
      
      this.pairs = response.data.symbols
        .filter(s => s.status === 'TRADING')
        .map(s => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          pair: `${s.baseAsset}/${s.quoteAsset}`
        }));
      
      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`Binance: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`Binance getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) {
        logger.warn(`Binance: Pair ${pair} not found`);
        return null;
      }

      const response = await axios.get(`${BINANCE_API_URL}/depth`, {
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
        timestamp: response.data.E || Date.now()
      });
    } catch (error) {
      logger.error(`Binance getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${BINANCE_API_URL}/ticker/24hr`, {
        params: { symbol },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(response.data.bidPrice),
        ask: parseFloat(response.data.askPrice),
        lastPrice: parseFloat(response.data.lastPrice),
        volume24h: parseFloat(response.data.volume),
        timestamp: response.data.closeTime
      };
    } catch (error) {
      logger.error(`Binance getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
