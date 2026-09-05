# Документация по API бирж и статусы адаптеров

## 📊 Статус адаптеров

| Биржа | Статус | REST API | WebSocket | Maker Fee | Taker Fee | Документация |
|-------|--------|----------|-----------|-----------|-----------|------|
| Binance | ✅ READY | ✅ Да | ✅ Да | 0.1% | 0.1% | https://binance-docs.github.io/apidocs |
| Bybit | ✅ READY | ✅ Да | ✅ Да | 0.1% | 0.1% | https://bybit-exchange.github.io/docs |
| OKX | ✅ READY | ✅ Да | ✅ Да | 0.1% | 0.15% | https://www.okx.com/docs-v5 |
| Bitget | ✅ READY | ✅ Да | ✅ Да | 0.1% | 0.1% | https://bitgetlimited.github.io/apidocs |
| KuCoin | ✅ READY | ✅ Да | ✅ Да | 0.1% | 0.1% | https://docs.kucoin.com |
| Gate.io | ✅ READY | ✅ Да | ✅ Да | 0.2% | 0.2% | https://www.gate.io/docs/developers |
| BingX | ✅ READY | ✅ Да | ✅ Да | 0.1% | 0.1% | https://bingx-api.github.io |
| MEXC | ✅ READY | ✅ Да | ✅ Да | 0.2% | 0.2% | https://mxcdeveloper.top/openapi |
| HTX | ✅ READY | ✅ Да | ⚠️ Limited | 0.2% | 0.2% | https://huobiapi.github.io/docs |
| Hyperliquid | ✅ READY | ✅ Да | - | 0.02% | 0.05% | https://hyperliquid.gitbook.io |
| ASTER | ✅ READY | ✅ Да | - | 0.2% | 0.2% | https://asterdex.gitbook.io |
| Ourbit | ✅ READY | ✅ Да | - | 0.15% | 0.15% | https://ourbit.gitbook.io |
| BitMart | ✅ READY | ✅ Да | ✅ Да | 0.25% | 0.25% | https://developer.bitmart.com |
| XT.com | ✅ READY | ✅ Да | ✅ Да | 0.2% | 0.2% | https://xtcom-api.gitbook.io |
| Ju.com | ✅ READY | ✅ Да | - | 0.2% | 0.2% | https://ju-api.gitbook.io |
| KCEX | ✅ READY | ✅ Да | - | 0.1% | 0.1% | https://kcex-api.gitbook.io |
| LeveX | ✅ READY | ✅ Да | - | 0.1% | 0.1% | https://levex-api.gitbook.io |
| edgeX | ✅ READY | ✅ Да | ✅ Да | 0.1% | 0.1% | https://edgex-exchange.gitbook.io |

## 🔌 API Endpoints по биржам

### Binance
```
Base URL: https://api.binance.com/api/v3
WebSocket: wss://stream.binance.com:9443/ws

Ключевые endpoints:
- GET /exchangeInfo - Информация о торговых парах
- GET /depth - Order book
- GET /ticker/24hr - 24h ticker
- GET /trades - Recent trades

Rate Limit: 1200 req/min
Поддержка: Все основные пары
```

### Bybit
```
Base URL: https://api.bybit.com/v5
WebSocket: wss://stream.bybit.com/v5/public/spot

Ключевые endpoints:
- GET /market/instruments-info - Information
- GET /market/orderbook - Order book
- GET /market/tickers - Ticker

Rate Limit: 500 req/min
Поддержка: 1000+ пар
```

### OKX
```
Base URL: https://www.okx.com/api/v5
WebSocket: wss://ws.okx.com:8443/ws/v5/public

Ключевые endpoints:
- GET /market/instruments - Инструменты
- GET /market/books - Книга заказов
- GET /market/ticker - Ticker

Rate Limit: 60 req/sec
Поддержка: 400+ пар
```

### Gate.io
```
Base URL: https://api.gateio.ws/api/v4
WebSocket: wss://api.gateio.ws/ws/v4

Ключевые endpoints:
- GET /spot/currency_pairs - Пары
- GET /spot/order_book - Order book
- GET /spot/tickers - Tickers

Rate Limit: 1000 req/min
Поддержка: 500+ пар
```

### KuCoin
```
Base URL: https://api.kucoin.com/api/v1
WebSocket: wss://ws-api.kucoin.com/socket.io

Ключевые endpoints:
- GET /symbols - Торговые пары
- GET /market/orderbook/level2_100 - Order book
- GET /market/stats - Statistics

Rate Limit: 3000 req/min
Поддержка: 2000+ пар
```

### Hyperliquid
```
Base URL: https://api.hyperliquid.xyz
Method: POST (REST)

Ключевые методы:
- metaAndAssetCtxs - Информация
- l2Book - Order book
- allMids - Все цены

Rate Limit: Нет
Поддержка: Перпетуалы только
```

## ⚠️ Известные проблемы и ограничения

### Binance
- ✅ Стабилен
- ✅ Лучший rate limit
- ✅ Самая большая ликвидность
- Минус: Блокирует VPN в некоторых странах

### Bybit
- ✅ Хороший rate limit
- ✅ WebSocket работает
- Минус: Иногда медленнее, чем Binance

### OKX
- ✅ Очень быстрый
- ✅ Хороший order book
- Минус: Немного выше комиссии

### Gate.io
- ✅ Стабилен
- ✅ Много пар
- Минус: Иногда ниже ликвидность

### KuCoin
- ✅ Много пар
- ✅ WebSocket
- Минус: Может быть менее стабилен

### Hyperliquid
- ✅ Низкие комиссии
- ✅ Нет rate limit
- Минус: Только перпетуалы, нет спота

### MEXC
- ✅ Много экзотических пар
- Минус: Иногда ниже ликвидность

### HTX
- ✅ Кредо: стабильность
- Минус: API может быть медленнее

### Меньшие биржи (ASTER, Ourbit, Ju, KCEX, LeveX, edgeX)
- ⚠️ Может быть ниже ликвидность
- ⚠️ API может быть менее стабилен
- ⚠️ Может потребоваться больше времени на ответ
- ✅ Часто имеют экзотические пары

## 🔍 Как добавить новый адаптер

### 1. Создать файл адаптера

```bash
touch src/exchanges/newex.js
```

### 2. Реализовать класс

```javascript
import { BaseExchangeAdapter } from './base.js';
import axios from 'axios';

const API_URL = 'https://api.newex.com/v1';

export class NewExAdapter extends BaseExchangeAdapter {
  constructor() {
    super('newex', {
      baseUrl: API_URL,
      makerFee: 0.1,
      takerFee: 0.1
    });
  }

  async getPairs() {
    // Implement
  }

  async getOrderBook(pair) {
    // Implement
  }

  async getTicker(pair) {
    // Implement
  }
}
```

### 3. Добавить в index.js

```javascript
import { NewExAdapter } from './newex.js';

const EXCHANGE_CONSTRUCTORS = {
  // ...
  newex: () => new NewExAdapter()
};
```

### 4. Добавить env переменную

```env
ENABLE_NEWEX=1
```

## 📞 Контакты бирж для поддержки

- Binance: https://www.binance.com/en/support
- Bybit: https://www.bybit.com/en-US/help-center
- OKX: https://www.okx.com/support
- Gate.io: https://www.gate.io/help
- KuCoin: https://support.kucoin.plus

## 🔐 API Rate Limits Summary

| Биржа | Лимит | Окно |
|-------|-------|------|
| Binance | 1200 | 1 мин |
| Bybit | 500 | 1 мин |
| OKX | 60 | 1 сек |
| Gate.io | 1000 | 1 мин |
| KuCoin | 3000 | 1 мин |
| BingX | 2000 | 1 мин |
| MEXC | 2000 | 1 мин |
| Hyperliquid | ∞ | - |
| BitMart | 500 | 1 мин |
| XT | 500 | 1 мин |

## ✅ Рекомендованные пары для тестирования

```
Основные (есть на всех биржах):
- BTC/USDT
- ETH/USDT
- BNB/USDT
- SOL/USDT

Популярные (есть на большинстве):
- XRP/USDT
- ADA/USDT
- DOGE/USDT
- LINK/USDT
```
