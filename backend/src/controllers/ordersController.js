const ordersRepository = require('../repositories/ordersRepository');
const settingsRepository = require('../repositories/settingsRepository');
const beholder = require('../beholder');

function thirtyDaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

function getToday() {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.getTime();
}

function calcVolume(orders, side, startTime, endTime) {
    startTime = !startTime ? 0 : startTime;
    endTime = !endTime ? Date.now() : endTime;

    const filteredOrders = orders.filter(o => o.transactTime >= startTime && o.transactTime < endTime && o.side === side);
    if (!filteredOrders || !filteredOrders.length) return 0;

    return filteredOrders.map(o => parseFloat(o.net))
        .reduce((a, b) => a + b);
}

async function getOrdersReport(req, res, next) {
    const quote = req.params.quote;

    let startDate = req.query.startDate ? parseInt(req.query.startDate) : thirtyDaysAgo();
    let endDate = req.query.endDate ? parseInt(req.query.endDate) : getToday();

    if ((endDate - startDate) > (31 * 24 * 60 * 60 * 1000)) startDate = thirtyDaysAgo();

    const orders = await ordersRepository.getReportOrders(quote, startDate, endDate);
    const wallet = beholder.getMemory(quote, 'WALLET');

    if (!orders || !orders.length) return res.json({
        quote,
        orders: 0,
        buyVolume: 0,
        sellVolume: 0,
        wallet,
        profit: 0,
        profitPerc: 0,
        startDate,
        endDate,
        subs: [],
        series: [],
        automations: []
    });

    const daysInRange = Math.ceil(endDate - startDate) / (24 * 60 * 60 * 1000);

    const subs = [];
    const series = [];
    for (let i = 0; i < daysInRange; i++) {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + i);
        subs.push(`${newDate.getDate()}/${newDate.getMonth() + 1}`);

        const lastMoment = new Date(newDate.getTime());
        lastMoment.setHours(23, 59, 59, 999);

        const partialBuy = calcVolume(orders, 'BUY', newDate.getTime(), lastMoment.getTime());
        const partialSell = calcVolume(orders, 'SELL', newDate.getTime(), lastMoment.getTime());
        series.push(partialSell - partialBuy);
    }

    const buyVolume = calcVolume(orders, 'BUY');
    const sellVolume = calcVolume(orders, 'SELL');
    const profit = sellVolume - buyVolume;
    const profitPerc = (profit * 100) / (parseFloat(wallet) - profit);

    const automationsObj = {};
    orders.forEach(o => {
        const automationId = o.automationId ?? 'M';
        if (!automationsObj[automationId]) {
            automationsObj[automationId] = {
                name: o.automationId ? o['automation.name'] : 'Manual',
                executions: 1,
                net: 0
            }
        }
        else
            automationsObj[automationId].executions++;

        if (o.side === 'BUY')
            automationsObj[automationId].net -= parseFloat(o.net);
        else
            automationsObj[automationId].net += parseFloat(o.net);
    })

    const automations = Object.entries(automationsObj).map(prop => prop[1]).sort((a, b) => b.net - a.net);

    res.json({
        quote,
        orders: orders.length,
        buyVolume,
        sellVolume,
        wallet,
        profit,
        profitPerc,
        startDate,
        endDate,
        subs,
        series,
        automations
    })
}

async function getOrders(req, res, next) {
    const symbol = req.params.symbol && req.params.symbol.toUpperCase();
    const page = parseInt(req.query.page);
    const orders = await ordersRepository.getOrders(symbol, page || 1);
    res.json(orders);
}

async function getLastOrders(req, res, next) {
    const orders = await ordersRepository.getLastFilledOrders();
    res.json(orders);
}

async function placeOrder(req, res, next) {
    const id = res.locals.token.id;
    const settings = await settingsRepository.getDecryptedSettings(id);
    const exchange = require('../utils/exchange')(settings);

    const { side, symbol, quantity, price, type, options, automationId } = req.body;

    let result;

    try {
        if (side === 'BUY')
            result = await exchange.buy(symbol, quantity, price, options);
        else
            result = await exchange.sell(symbol, quantity, price, options);
    }
    catch (err) {
        return res.status(400).json(err.body);
    }

    const order = await ordersRepository.insertOrder({
        automationId,
        symbol,
        quantity,
        type,
        side,
        limitPrice: price,
        stopPrice: options ? options.stopPrice : null,
        icebergQuantity: options ? options.icebergQty : null,
        orderId: result.orderId,
        clientOrderId: result.clientOrderId,
        transactTime: result.transactTime,
        status: result.status
    })

    res.status(201).json(order.get({ plain: true }));
}

async function cancelOrder(req, res, next) {
    const id = res.locals.token.id;
    const settings = await settingsRepository.getDecryptedSettings(id);
    const exchange = require('../utils/exchange')(settings);

    const { symbol, orderId } = req.params;

    try {
        result = await exchange.cancel(symbol, orderId);
    }
    catch (err) {
        return res.status(400).json(err.body);
    }

    const order = await ordersRepository.updateOrderByOrderId(result.orderId, result.origClientOrderId, {
        status: result.status
    });

    res.json(order.get({ plain: true }));
}

module.exports = {
    getOrders,
    placeOrder,
    cancelOrder,
    getOrdersReport,
    getLastOrders
}