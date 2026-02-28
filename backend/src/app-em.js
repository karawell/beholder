const ordersRepository = require('./repositories/ordersRepository');
const { getActiveMonitors, monitorTypes } = require('./repositories/monitorsRepository');
const { execCalc, indexKeys } = require('./utils/indexes');
const logger = require('./utils/logger');

let WSS, beholder, exchange, settings;

const RECONNECT_INTERVAL = 5000;

function scheduleRestart(monitorFn, label) {
    logger.warn(`Monitor ${label} failed. Restarting in ${RECONNECT_INTERVAL / 1000}s...`);
    setTimeout(() => {
        try {
            monitorFn();
        } catch (err) {
            logger.error(`Monitor ${label} failed to restart: ${err.message}`);
            scheduleRestart(monitorFn, label);
        }
    }, RECONNECT_INTERVAL);
}

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
    logger.info(`Mini-Ticker Monitor has started at ${broadcastLabel}!`);
    return () => startMiniTickerMonitor(broadcastLabel, logs);
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
    logger.info(`Book Monitor has started at ${broadcastLabel}!`);
    return () => startBookMonitor(broadcastLabel, logs);
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
            logger.error(err);
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
    logger.info(`User Data Monitor has started at ${broadcastLabel}!`);
    return () => startUserDataMonitor(broadcastLabel, logs);
}


async function processChartData(symbol, indexes, interval, ohlc, logs) {
    if (typeof indexes === 'string') indexes = indexes.split(',');
    if (!indexes || !Array.isArray(indexes) || indexes.length === 0) return false;

    return Promise.all(indexes.map(async (index) => {
        const params = index.split('_');
        const indexName = params[0];
        params.splice(0, 1);

        try {
            const calc = execCalc(indexName, ohlc, ...params);
            if (logs) console.log(`${index} calculated: ${JSON.stringify(calc.current ? calc.current : calc)}`);
            return beholder.updateMemory(symbol, index, interval, calc, calc.current !== undefined);
        } catch (err) {
            logger.error(`Exchange Monitor => Can't calc the index ${index}: ${err.message}`);
            return false;
        }
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

    logger.info(`Chart Monitor has started at ${symbol}_${interval}!`);
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

async function init(monitorSettings, wssInstance, beholderInstance) {
    if (!monitorSettings || !beholderInstance) throw new Error(`Can't start Exchange Monitor without settings and/or Beholder.`);

    WSS = wssInstance;
    beholder = beholderInstance;
    settings = monitorSettings;
    exchange = require('./utils/exchange')(settings);

    const monitors = await getActiveMonitors();
    monitors.map(monitor => {
        setTimeout(() => {
            let restartFn;
            switch (monitor.type) {
                case monitorTypes.MINI_TICKER:
                    restartFn = startMiniTickerMonitor(monitor.broadcastLabel, monitor.logs);
                    break;
                case monitorTypes.BOOK:
                    restartFn = startBookMonitor(monitor.broadcastLabel, monitor.logs);
                    break;
                case monitorTypes.USER_DATA:
                    restartFn = startUserDataMonitor(monitor.broadcastLabel, monitor.logs);
                    break;
                case monitorTypes.CANDLES:
                    return startChartMonitor(monitor.symbol,
                        monitor.interval,
                        monitor.indexes ? monitor.indexes.split(',') : [],
                        monitor.broadcastLabel,
                        monitor.logs);
            }
            if (restartFn instanceof Error) scheduleRestart(restartFn, monitor.type);
        }, 250)
    })

    const lastOrders = await ordersRepository.getLastFilledOrders();
    await Promise.all(lastOrders.map(async (order) => {
        const orderCopy = getLightOrder(order.get({ plain: true }));
        await beholder.updateMemory(order.symbol, indexKeys.LAST_ORDER, null, orderCopy, false);
    }))

    logger.info('App Exchange Monitor is running!')
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