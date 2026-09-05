# Руководство по развёртыванию Сканера

## 📋 Требования

- Node.js >= 16
- npm >= 8

## 🚀 Локальный запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/RKJAX/SCANNER.git
cd SCANNER
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Конфигурация

```bash
cp .env.example .env
```

Отредактируйте `.env` при необходимости:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Включение/отключение бирж
ENABLE_BINANCE=1
ENABLE_BYBIT=1
ENABLE_OKX=1
# ...
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

### 5. Открыть в браузере

```
http://localhost:3000
```

## 🐳 Docker развёртывание

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Создать и запустить:

```bash
docker build -t scanner .
docker run -p 3000:3000 scanner
```

## ☁️ Развёртывание на Heroku

```bash
heroku login
heroku create my-scanner
git push heroku main
heroku open
```

## ☁️ Развёртывание на Vercel

```bash
npm install -g vercel
vercel
```

## 🔧 Production сборка

```bash
npm run build
npm start
```

## 📊 Использование API

### Получить список бирж

```bash
curl http://localhost:3000/api/exchanges
```

### Получить доступные пары

```bash
curl "http://localhost:3000/api/pairs?exchanges=binance,bybit"
```

### Сканировать арбитраж

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "exchanges": ["binance", "bybit"],
    "pair": "BTC/USDT",
    "minAmount": 1000,
    "minLiquidity": 5000,
    "minSpread": 0.1
  }'
```

### Получить сигналы

```bash
curl "http://localhost:3000/api/signals?limit=50"
```

## 🌐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error

# Timeouts
API_TIMEOUT_MS=10000
WEBSOCKET_TIMEOUT_MS=30000

# Scanning
DEFAULT_SCAN_INTERVAL_MS=5000
MIN_SPREAD_THRESHOLD=0.1

# Exchanges
ENABLE_BINANCE=1
ENABLE_BYBIT=1
ENABLE_OKX=1
ENABLE_BITGET=1
ENABLE_KUCOIN=1
ENABLE_GATE=1
ENABLE_BINGX=1
ENABLE_MEXC=1
ENABLE_HTX=1
ENABLE_HYPERLIQUID=1
ENABLE_ASTER=1
ENABLE_OURBIT=1
ENABLE_BITMART=1
ENABLE_XT=1
ENABLE_JU=1
ENABLE_KCEX=1
ENABLE_LEVEX=1
ENABLE_EDGEX=1
```

## 🔐 Безопасность

- ✅ Используются только публичные market-data API
- ✅ Без API keys пользователей
- ✅ Без автоматической торговли
- ✅ CORS ограничения
- ✅ Rate limiting

## 📝 Логирование

Логи выводятся в консоль:

```
[2026-09-05T12:00:00.000Z] [INFO] Server running on http://localhost:3000
[2026-09-05T12:00:00.000Z] [INFO] Initialized 18 exchanges
```

## 🐛 Отладка

Для подробных логов:

```bash
LOG_LEVEL=debug npm run dev
```

## 📚 Структура проекта

```
src/
├── server.js              # Entry point
├── exchanges/             # Exchange adapters
│   ├── base.js
│   ├── binance.js
│   ├── bybit.js
│   ├── okx.js
│   └── ... (15 more)
├── core/
│   ├── scanner.js        # Main scanning engine
│   ├── arbitrage.js      # Calculations
│   └── orderbook.js      # Order book analysis
├── api/
│   ├── exchanges.js      # GET /api/exchanges
│   ├── pairs.js          # GET /api/pairs
│   ├── scan.js           # POST /api/scan
│   └── signals.js        # GET /api/signals
├── middleware/
│   └── errorHandler.js
└── utils/
    ├── logger.js
    ├── cache.js
    └── validators.js

public/
├── index.html
├── css/styles.css
└── js/
    ├── app.js
    ├── ui.js
    └── api-client.js
```

## 🚨 Известные ограничения API

### Binance
- Rate limit: 1200 requests per minute
- Pair limit: ~2000
- Order book depth: до 5000 levels

### Bybit
- Rate limit: 500 requests per minute
- WebSocket: поддерживается
- Taker fee: 0.1%

### OKX
- Rate limit: 60 requests per second
- Pair limit: ~400
- Maker fee: 0.1%

### Gate.io
- Rate limit: 1000 requests per minute
- WebSocket: поддерживается
- Taker fee: 0.2%

### KuCoin
- Rate limit: 3000 requests per minute
- WebSocket: поддерживается
- Taker fee: 0.1%

### Hyperliquid
- No rate limit (обычно)
- Perpetual contracts only
- Taker fee: 0.05%

### MEXC
- Rate limit: 2000 requests per minute
- WebSocket: поддерживается
- Taker fee: 0.2%

## ✅ Проверка реальных данных

### 1. Проверить статус биржи

```bash
curl http://localhost:3000/api/exchanges
```

Проверьте:
- ✅ Status = "LIVE"
- ✅ lastUpdate недавний (< 60 сек)
- ✅ pairsLoaded > 0

### 2. Проверить пары

```bash
curl "http://localhost:3000/api/pairs?exchanges=binance,bybit"
```

Проверьте: пары совпадают с официальными сайтами бирж

### 3. Запустить сканирование

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "exchanges": ["binance", "bybit"],
    "pair": "BTC/USDT",
    "minAmount": 1000,
    "minLiquidity": 5000,
    "minSpread": 0.1
  }'
```

Проверьте:
- ✅ Prices соответствуют рыночным
- ✅ Timestamps свежие
- ✅ Нет mock данных
- ✅ Liquidity проверена на order book
- ✅ Fees применены корректно

### 4. Сравнить с официальными источниками

- Binance: https://www.binance.com/trade/BTC_USDT
- Bybit: https://www.bybit.com/trade/spot/BTCUSDT
- OKX: https://www.okx.com/trade-spot/BTC-USDT

## 🎯 Критерии готовности

✅ **Данные реальные**
- API запросы идут на реальные endpoints
- Цены обновляются в реальном времени
- Нет mock или hardcoded значений

✅ **Order book анализируется корректно**
- Проверяется глубина стакана
- Рассчитывается цена исполнения по нескольким уровням
- Проверяется достаточная ликвидность

✅ **Сигналы валидные**
- Только реальные неэффективности
- Учтены комиссии каждой биржи
- Проверена исполнимость на заданную сумму
- Нет тестовых или демонстрационных сигналов

✅ **Интерфейс работает корректно**
- Выбор бирж и пары
- Фильтрация по параметрам
- Таблица сигналов обновляется
- Детали сигнала открываются

## 📞 Поддержка

Откройте Issue на GitHub с описанием проблемы.
