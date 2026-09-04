// Base adapter class for all exchanges
import { logger } from '../utils/logger.js';

export class BaseExchangeAdapter {
  constructor(name, config = {}) {
    this.name = name;
    this.baseUrl = config.baseUrl;
    this.wsUrl = config.wsUrl;
    this.timeout = config.timeout || 10000;
    this.status = 'OFFLINE';
    this.lastUpdate = null;
    this.tradingFee = config.tradingFee || null; // in percentage, e.g., 0.1 for 0.1%
    this.makerFee = config.makerFee || null;
    this.takerFee = config.takerFee || null;
  }

  setStatus(status) {
    this.status = status;
    this.lastUpdate = Date.now();
  }

  getStatus() {
    if (!this.lastUpdate) return 'NO DATA';
    const age = Date.now() - this.lastUpdate;
    if (age > 60000) return 'OFFLINE'; // 60 seconds
    if (age > 10000) return 'DELAYED'; // 10 seconds
    return 'LIVE';
  }

  // Must be implemented by subclasses
  async getPairs() {
    throw new Error('getPairs not implemented');
  }

  async getOrderBook(pair) {
    throw new Error('getOrderBook not implemented');
  }

  async getTicker(pair) {
    throw new Error('getTicker not implemented');
  }

  normalizeOrderBook(data) {
    // Standard format: { bids: [[price, volume], ...], asks: [[price, volume], ...] }
    return {
      bids: data.bids || [],
      asks: data.asks || [],
      timestamp: data.timestamp || Date.now()
    };
  }

  normalizePair(pair) {
    // Convert to uppercase and standardize format
    return pair.toUpperCase().replace('_', '/');
  }
}
