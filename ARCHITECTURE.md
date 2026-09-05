# Архитектура Сканера

## 🏗️ Общая структура

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Browser)                     │
│              HTML/CSS/JavaScript (React-like)           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   EXPRESS SERVER                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │              REST API Routes                        ││
│  │  /api/exchanges  /api/pairs  /api/scan  /api/signals││
│  └────────────────┬─────────────────────────────────────┘│
│                   │                                       │
│  ┌────────────────▼─────────────────────────────────────┐│
│  │            SCANNER ENGINE (Core Logic)              ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ ││
│  │  │  Arbitrage   │  │  OrderBook   │  │  Metrics   │ ││
│  │  │ Calculation  │  │   Analysis   │  │Calculation│ ││
│  │  └──────────────┘  └──────────────┘  └────────────┘ ││
│  └────────┬────────────────────────────────────────────┘ │
│           │                                              │
│  ┌────────▼────────────────────────────────────────────┐ │
│  │         EXCHANGE ADAPTERS (18 exchanges)            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │ │
│  │  │ Binance  │ │  Bybit   │ │   OKX    │ │ ... 15 │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │ │
│  └────────┬──────────────────────────────────────────────┘ │
│           │                                                │
│  ┌────────▼──────────────────────────────────────────────┐ │
│  │  REST API Clients (axios, fetch)                      │ │
│  └────────┬──────────────────────────────────────────────┘ │
└───────────┼────────────────────────────────────────────────┘
            │
┌───────────▼────────────────────────────────────────────────┐
│              EXCHANGE PUBLIC APIs                           │
│  https://api.binance.com, https://api.bybit.com, ...       │
└────────────────────────────────────────────────────────────┘
```

## 📦 Модули

### Exchange Adapters (`src/exchanges/`)

Каждый адаптер реализует интерфейс:

```typescript
interface ExchangeAdapter {
  name: string
  baseUrl: string
  wsUrl?: string
  status: 'LIVE' | 'DELAYED' | 'OFFLINE' | 'NO DATA'
  lastUpdate: number
  
  getPairs(): Promise<Pair[]>
  getOrderBook(pair: string): Promise<OrderBook>
  getTicker(pair: string): Promise<Ticker>
  getStatus(): string
  setStatus(status: string): void
}
```

**Примеры адаптеров:**
- `binance.js` - Binance API
- `bybit.js` - Bybit API
- `okx.js` - OKX API
- ... и ещё 15

### Core Modules (`src/core/`)

#### `scanner.js`

Основной двигатель сканирования:

```typescript
class Scanner {
  scan(params: ScanParams): Promise<Signal[]>
  findArbitrage(buyEx, sellEx, pair, ob1, ob2): Signal | null
  getSignals(limit: number): Signal[]
}
```

**Логика:**
1. Получить выбранные биржи
2. Загрузить order books для всех пар
3. Для каждой пары перебрать все пары бирж
4. Найти возможности buy→sell и sell→buy
5. Проверить ликвидность и спред
6. Отфильтровать и отсортировать по профитабельности

#### `arbitrage.js`

Расчёты арбитража:

```typescript
class ArbitrageCalculator {
  calculateGrossSpread(buyPrice, sellPrice): number
  calculateTradingFees(amount, buyPrice, sellPrice): Fees
  estimateSlippage(orderBook, amount, price): number
  calculateNetSpread(grossSpread, fees): number
  calculateEstimatedProfit(amount, buyPrice, sellPrice, fees): Profit
}
```

#### `orderbook.js`

Анализ стакана:

```typescript
function calculateLiquidityAtPrice(ob, amount, side): LiquidityInfo
function getAverageExecutionPrice(ob, amount, side): number
function hasSufficientLiquidity(ob, amount, side): boolean
function getBestPriceAndVolume(ob, side): PriceVolume
```

### API Routes (`src/api/`)

#### `exchanges.js`

```
GET /api/exchanges
→ {
  success: true,
  total: 18,
  exchanges: [
    {
      name: "binance",
      status: "LIVE",
      lastUpdate: 1234567890,
      pairsLoaded: 2000,
      makerFee: 0.1,
      takerFee: 0.1,
      website: "https://www.binance.com"
    },
    ...
  ]
}
```

#### `pairs.js`

```
GET /api/pairs?exchanges=binance,bybit
→ {
  success: true,
  total: 500,
  pairs: ["BTC/USDT", "ETH/USDT", ...]
}
```

#### `scan.js`

```
POST /api/scan
← {
  exchanges: ["binance", "bybit"],
  pair: "BTC/USDT",
  minAmount: 1000,
  minLiquidity: 5000,
  minSpread: 0.1
}
→ {
  success: true,
  count: 5,
  signals: [...],
  timestamp: 1234567890
}
```

#### `signals.js`

```
GET /api/signals?limit=50
→ {
  success: true,
  count: 5,
  signals: [...]
}

GET /api/signals/:index
→ {
  success: true,
  signal: { full signal details }
}
```

## 🔄 Поток обработки запроса

```
1. User selects: Binance, Bybit, OKX, Bitget
2. User sets: BTC/USDT, $1000, $5000 liquidity, 0.1% min spread
3. User clicks: SCAN button
   ↓
4. Frontend sends POST /api/scan with params
   ↓
5. Scanner.scan() executes:
   a. Filter exchanges
   b. Load order books for each exchange
   c. For each pair of exchanges:
      - Check BUY on Ex1 → SELL on Ex2
      - Check SELL on Ex1 → BUY on Ex2
   d. For each potential signal:
      - Get best bid/ask prices
      - Check liquidity on both sides
      - Calculate gross spread
      - Calculate fees
      - Estimate slippage
      - Calculate net spread
      - Calculate estimated profit
      - Validate: spread >= minSpread
      - Validate: liquidity >= minLiquidity
   e. Sort by profitability
   f. Return top signals
   ↓
6. Frontend receives signals
7. Render signals table
8. User clicks on signal → Show details modal
```

## 📊 Формулы расчётов

### Gross Spread
```
((Sell Price - Buy Price) / Buy Price) × 100%
```

### Fees
```
Buy Fee = Buy Amount × Buy Maker Fee %
Sell Fee = Buy Amount × Sell Taker Fee %
Total Fee = Buy Fee + Sell Fee
```

### Net Spread
```
Net Spread = Gross Spread - (Total Fee / Buy Amount × 100)
```

### Estimated Profit
```
Gross Profit = (Sell Amount × Sell Price) - (Buy Amount × Buy Price)
Net Profit = Gross Profit - Total Fees
ROI = (Net Profit / (Buy Amount × Buy Price)) × 100%
```

### Average Execution Price
```
If insufficient liquidity at best price,
calculate weighted average across order book levels:

AvgPrice = Σ(Level Price × Level Volume) / Total Volume
```

## 🔌 Data Flow

### REST API

```
Client
  ↓ HTTP POST /api/scan with params
  ↓
Express Server
  ↓ Validate params
  ↓
Scanner
  ↓ Get order books from adapters (parallel)
  ↓
Adapters (Binance, Bybit, etc.)
  ↓ HTTP GET https://api.*.com/v1/depth
  ↓
Exchange APIs
  ↓ Return raw order books
  ↓
Adapters
  ↓ Normalize to standard format
  ↓
Scanner
  ↓ Analyze and calculate
  ↓
JSON Response
  ↓ HTTP 200 with signals
  ↓
Client
```

### WebSocket (Future Enhancement)

```
Client connects to:
ws://localhost:3000/api/scan

Send:
{"type": "scan", "payload": {...}}

Receive:
{"type": "scan_result", "data": {...}}
or
{"type": "error", "message": "..."}
```

## ⚙️ Конфигурация

### Таймауты
- API timeout: 10 сек
- WebSocket timeout: 30 сек
- Scan interval: 5 сек

### Rate Limiting
- По бирже: ~1200 req/min (Binance)
- Глобальный лимит: настраивается через env

### Ликвидность
- Минимум по умолчанию: $1000
- Максимум анализируемой глубины: 100 уровней order book

## 🛡️ Error Handling

```
If API fails:
  1. Catch error in adapter
  2. Log error
  3. Set exchange status to OFFLINE/DELAYED
  4. Return null or cached data
  5. Continue with other exchanges
  
If pair not found:
  1. Filter pair from available pairs
  2. Skip this pair for that exchange
  3. Continue with other pairs
  
If insufficient liquidity:
  1. Mark signal as invalid
  2. Don't show to user
  3. Log reason
```

## 🚀 Performance Optimization

1. **Parallel API calls** - Load from multiple exchanges simultaneously
2. **Caching** - Cache pairs list (TTL: 5 min)
3. **Filtering** - Early exit if spread too low
4. **Sorting** - Sort only relevant signals (top 50)

## 📈 Scalability

- ✅ Supports 18 exchanges
- ✅ Can handle 1000+ trading pairs
- ✅ Can monitor multiple currencies simultaneously
- ✅ Horizontal scaling: multiple instances behind load balancer
