export function validatePair(pair) {
  // Format: BTC/USDT
  const pairRegex = /^[A-Z0-9]{2,}(\/[A-Z0-9]{2,})?$/i;
  return pairRegex.test(pair);
}

export function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

export function validateExchange(exchange) {
  const validExchanges = [
    'binance', 'bybit', 'okx', 'bitget', 'kucoin',
    'gate', 'bingx', 'mexc', 'htx', 'hyperliquid',
    'aster', 'ourbit', 'bitmart', 'xt', 'ju',
    'kcex', 'levex', 'edgex'
  ];
  return validExchanges.includes(exchange.toLowerCase());
}

export function validateScanRequest(req) {
  const { exchanges, pair, minAmount, minLiquidity } = req;
  
  if (!exchanges || !Array.isArray(exchanges) || exchanges.length === 0) {
    return { valid: false, error: 'exchanges must be non-empty array' };
  }
  
  if (!validatePair(pair)) {
    return { valid: false, error: 'invalid pair format' };
  }
  
  if (!validateAmount(minAmount)) {
    return { valid: false, error: 'minAmount must be positive number' };
  }
  
  if (minLiquidity && !validateAmount(minLiquidity)) {
    return { valid: false, error: 'minLiquidity must be positive number' };
  }
  
  for (const ex of exchanges) {
    if (!validateExchange(ex)) {
      return { valid: false, error: `invalid exchange: ${ex}` };
    }
  }
  
  return { valid: true };
}
