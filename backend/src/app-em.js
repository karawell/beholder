const ordersRepository = require('./repositories/ordersRepository');
const { getActiveMonitors, monitorTypes } = require('./repositories/monitorsRepository');
const { RSI, MACD, indexKeys, BollingerBands, StochRSI, EMA, SMA } = require('./utils/indexes');

let WSS, beholder, exchange;

function startMiniTickerMonitor(broadcastLabel, logs) {
    if (!exchange) return new Error(`Exchange Monitor not initialized yet!`);

    exchange.miniTickerStream(async (markets) => {
        if (logs) console.log(markets);

        Object.entries(markets).map(async (mkt) => {
            delete mkt[1].volume;
            delete mkt[1].quoteVolume;
            delete mkt[1].eventTime;

            const converted = {};
            Object.entries(mkt[1]).map(prop => converted[prop[0]] = parseFloat(prop[1]));
            const results = await beholder.updateMemory(mkt[0], indexKeys.MINI_TICKER, null, converted);
            if (results) results.map(r => WSS.broadcast({ notification: r }));
        })

        if (broadcastLabel && WSS)
            WSS.broadcast({ [broadcastLabel]: markets });
    })
    console.log(`Mini-Ticker Monitor has started at ${broadcastLabel}!`);
}

let book = [];
function startBookMonitor(broadcastLabel, logs) {
    if (!exchange) return new Error(`Exchange Monitor not initialized yet!`);

    exchange.bookStream(async (order) => {

        if (logs) console.log(order);

        if (book.length >= 200) {
            if (broadcastLabel && WSS)
                WSS.broadcast({ [broadcastLabel]: book });
            book = [];
        }
        else book.push(order);

        const orderCopy = { ...order };
        delete orderCopy.symbol;
        delete orderCopy.updateId;
        delete orderCopy.bestAskQty;
        delete orderCopy.bestBidQty;

        const converted = {};
        Object.entries(orderCopy).map(prop => converted[prop[0]] = parseFloat(prop[1]));

        const currentMemory = beholder.getMemory(order.symbol, indexKeys.BOOK);

        const newMemory = {};
        newMemory.previous = currentMemory ? currentMemory.current : converted;
        newMemory.current = converted;

        const results = await beholder.updateMemory(order.symbol, indexKeys.BOOK, null, newMemory);
        if (results) results.map(r => WSS.broadcast({ notification: r }));
    })
    console.log(`Book Monitor has started at ${broadcastLabel}!`);
}

async function loadWallet() {
    if (!exchange) return new Error(`Exchange Monitor not initialized yet!`);
    const info = await exchange.balance();
    const wallet = Object.entries(info).map(async (item) => {

        const results = await beholder.updateMemory(item[0], indexKeys.WALLET, null, parseFloat(item[1].available));
        if (results) results.map(r => WSS.broadcast({ notification: r }));

        return {
            symbol: item[0],
            available: item[1].available,
            onOrder: item[1].onOrder
        }
    })
    return wallet;
}

function notifyOrderUpdate(order) {
    let type = '';
    switch (order.status) {
        case 'FILLED': type = 'success'; break;
        case 'REJECTED':
        case 'CANCELED':
        case 'EXPIRED': type = 'error'; break;
        default: type = 'info'; break;
    }
    WSS.broadcast({ notification: { type, text: `Order #${order.orderId} was updated as ${order.status}.` } });
}

function processExecutionData(executionData, broadcastLabel) {

    if (executionData.x === 'NEW') return;

    const order = {
        symbol: executionData.s,
        orderId: executionData.i,
        clientOrderId: executionData.X === 'CANCELED' ? executionData.C : executionData.c,
        side: executionData.S,
        type: executionData.o,
        status: executionData.X,
        isMaker: executionData.m,
        transactTime: executionData.T
    }

    if (order.status === 'FILLED') {
        const quoteAmount = parseFloat(executionData.Z);
        order.avgPrice = quoteAmount / parseFloat(executionData.z);
        order.commission = executionData.n;
        const isQuoteCommission = executionData.N && order.symbol.endsWith(executionData.N);
        order.net = isQuoteCommission ? quoteAmount - parseFloat(order.commission) : quoteAmount;
    }

    if (order.status === 'REJECTED') order.obs = executionData.r;

    setTimeout(async () => {
        try {
            const updatedOrder = await ordersRepository.updateOrderByOrderId(order.orderId, order.clientOrderId, order)
            if (updatedOrder) {

                notifyOrderUpdate(order);

                const orderCopy = getLightOrder(updatedOrder.get({ plain: true }));

                const results = await beholder.updateMemory(updatedOrder.symbol, indexKeys.LAST_ORDER, null, orderCopy);
                if (results) results.map(r => WSS.broadcast({ notification: r }));
                if (broadcastLabel && WSS)
                    WSS.broadcast({ [broadcastLabel]: orderCopy });
            }
        } catch (err) {
            console.error(err)
        }
    }, 3000)
}

function startUserDataMonitor(broadcastLabel, logs) {
    if (!exchange) return new Error(`Exchange Monitor not initialized yet!`);

    const [balanceBroadcast, executionBroadcast] = broadcastLabel ? broadcastLabel.split(',') : [null, null];

    loadWallet();

    exchange.userDataStream(
        balanceData => {
            if (logs) console.log(balanceData);
            const wallet = loadWallet();
            if (balanceBroadcast && WSS)
                WSS.broadcast({ [balanceBroadcast]: wallet });
        },
        executionData => {
            if (logs) console.log(executionData);
            processExecutionData(executionData, executionBroadcast);
        }
    )
    console.log(`User Data Monitor has started at ${broadcastLabel}!`);
}


async function processChartData(symbol, indexes, interval, ohlc, logs) {
    if (typeof indexes === 'string') indexes = indexes.split(',');
    if (!indexes || !Array.isArray(indexes) || indexes.length === 0) return false;

    return Promise.all(indexes.map(async (index) => {
        const params = index.split('_');
        const indexName = params[0];
        params.splice(0, 1);

        let calc;

        try {

            switch (indexName) {
                case indexKeys.RSI: calc = RSI(ohlc.close, ...params); break;
                case indexKeys.MACD: calc = MACD(ohlc.close, ...params); break;
                case indexKeys.BOLLINGER_BANDS: calc = BollingerBands(ohlc.close, ...params); break;
                case indexKeys.EMA: calc = EMA(ohlc.close, ...params); break;
                case indexKeys.SMA: calc = SMA(ohlc.close, ...params); break;
                case indexKeys.STOCH_RSI: calc = StochRSI(ohlc.close, ...params); break;
                default: return false;
            }
        } catch (err) {
            console.error(`Exchange Monitor => Can't calc the index ${index}:`);
            console.error(err);
            return false;
        }

        if (logs) console.log(`${index} calculated: ${JSON.stringify(calc.current)}`);

        return beholder.updateMemory(symbol, index, interval, calc);
    }));
}

function startChartMonitor(symbol, interval, indexes, broadcastLabel, logs) {

    if (!symbol) return new Error(`You can't start a Chart Monitor without a symbol!`);
    if (!exchange) return new Error(`Exchange Monitor not initialized yet!`);

    exchange.chartStream(symbol, interval || '1m', async (ohlc) => {

        const lastCandle = {
            open: ohlc.open[ohlc.open.length - 1],
            close: ohlc.close[ohlc.close.length - 1],
            high: ohlc.high[ohlc.high.length - 1],
            low: ohlc.low[ohlc.low.length - 1]
        }

        if (logs) console.log(lastCandle);

        let results = await beholder.updateMemory(symbol, indexKeys.LAST_CANDLE, interval, lastCandle);
        if (results) results.map(r => WSS.broadcast({ notification: r }));

        if (broadcastLabel && WSS) WSS.broadcast(lastCandle);

        results = await processChartData(symbol, indexes, interval, ohlc, logs);
        if (results) results.map(r => WSS.broadcast({ notification: r }));
    })

    console.log(`Chart Monitor has started at ${symbol}_${interval}!`);
}

function stopChartMonitor(symbol, interval, indexes, logs) {
    if (!symbol) return new Error(`You can't stop a Chart Monitor without a symbol!`);
    if (!exchange) return new Error(`Exchange Monitor not initialized yet!`);

    exchange.terminateChartStream(symbol, interval);
    if (logs) console.log(`Chart Monitor ${symbol}_${interval} stopped!`);

    beholder.deleteMemory(symbol, 'LAST_CANDLE', interval);

    if (indexes && Array.isArray(indexes) && indexes.length)
        indexes.map(ix => beholder.deleteMemory(symbol, ix, interval));
}

async function init(settings, wssInstance, beholderInstance) {
    if (!settings || !beholderInstance) throw new Error(`Can't start Exchange Monitor without settings and/or Beholder.`);

    WSS = wssInstance;
    beholder = beholderInstance;
    exchange = require('./utils/exchange')(settings);

    const monitors = await getActiveMonitors();
    monitors.map(monitor => {
        setTimeout(() => {
            switch (monitor.type) {
                case monitorTypes.MINI_TICKER:
                    return startMiniTickerMonitor(monitor.broadcastLabel, monitor.logs);
                case monitorTypes.BOOK:
                    return startBookMonitor(monitor.broadcastLabel, monitor.logs);
                case monitorTypes.USER_DATA:
                    return startUserDataMonitor(monitor.broadcastLabel, monitor.logs);
                case monitorTypes.CANDLES:
                    return startChartMonitor(monitor.symbol,
                        monitor.interval,
                        monitor.indexes ? monitor.indexes.split(',') : [],
                        monitor.broadcastLabel,
                        monitor.logs);
            }
        }, 250)
    })

    const lastOrders = await ordersRepository.getLastFilledOrders();
    await Promise.all(lastOrders.map(async (order) => {
        const orderCopy = getLightOrder(order.get({ plain: true }));
        await beholder.updateMemory(order.symbol, indexKeys.LAST_ORDER, null, orderCopy, false);
    }))

    console.log('App Exchange Monitor is running!')
}

function getLightOrder(order) {
    const orderCopy = { ...order };
    delete orderCopy.id;
    delete orderCopy.symbol;
    delete orderCopy.automationId;
    delete orderCopy.orderId;
    delete orderCopy.clientOrderId;
    delete orderCopy.transactTime;
    delete orderCopy.isMaker;
    delete orderCopy.commission;
    delete orderCopy.obs;
    delete orderCopy.Automation;
    delete orderCopy.createdAt;
    delete orderCopy.updatedAt;
    orderCopy.limitPrice = parseFloat(orderCopy.limitPrice);
    orderCopy.stopPrice = parseFloat(orderCopy.stopPrice);
    orderCopy.avgPrice = parseFloat(orderCopy.avgPrice);
    orderCopy.net = parseFloat(orderCopy.net);
    orderCopy.quantity = parseFloat(orderCopy.quantity);
    orderCopy.icebergQuantity = parseFloat(orderCopy.icebergQuantity);
    return orderCopy;
}

module.exports = {
    init,
    startChartMonitor,
    stopChartMonitor
}