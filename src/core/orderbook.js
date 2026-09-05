import Decimal from 'decimal.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate liquidity at specific price level in order book
 */
export function calculateLiquidityAtPrice(orderBook, targetAmount, side = 'ask') {
  const orders = side === 'ask' ? orderBook.asks : orderBook.bids;
  let totalLiquidity = 0;
  let executionPrice = null;
  let executionAmount = 0;

  for (const [price, volume] of orders) {
    const levelValue = new Decimal(price).times(volume);
    
    if (executionAmount < targetAmount) {
      const neededAmount = targetAmount - executionAmount;
      const canExecute = Math.min(neededAmount / price, volume);
      
      executionAmount += canExecute * price;
      executionPrice = price;
    }
    
    totalLiquidity += levelValue.toNumber();
    
    if (totalLiquidity >= targetAmount) break;
  }

  return {
    availableLiquidity: totalLiquidity,
    executionPrice: executionPrice,
    canExecute: executionAmount >= targetAmount * 0.95, // Allow 5% slippage
    executionAmount: executionAmount
  };
}

/**
 * Get average execution price for a given order volume
 */
export function getAverageExecutionPrice(orderBook, targetAmount, side = 'ask') {
  const orders = side === 'ask' ? orderBook.asks : orderBook.bids;
  let totalCost = 0;
  let totalVolume = 0;

  for (const [price, volume] of orders) {
    const volumeToExecute = Math.min(targetAmount / price - totalVolume, volume);
    totalCost += price * volumeToExecute;
    totalVolume += volumeToExecute;

    if (totalVolume >= targetAmount / price) break;
  }

  return totalVolume > 0 ? totalCost / totalVolume : null;
}

/**
 * Check if sufficient liquidity exists
 */
export function hasSufficientLiquidity(orderBook, minAmount, side = 'ask') {
  const result = calculateLiquidityAtPrice(orderBook, minAmount, side);
  return result.availableLiquidity >= minAmount && result.canExecute;
}

/**
 * Get best price and available volume
 */
export function getBestPriceAndVolume(orderBook, side = 'ask') {
  const orders = side === 'ask' ? orderBook.asks : orderBook.bids;
  
  if (!orders || orders.length === 0) return null;
  
  const [price, volume] = orders[0];
  return {
    price: parseFloat(price),
    volume: parseFloat(volume),
    side: side
  };
}
