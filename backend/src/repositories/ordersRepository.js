const orderModel = require('../models/orderModel');
const Sequelize = require('sequelize');
const automationModel = require('../models/automationModel');

const PAGE_SIZE = 10;

const FINAL_STATUS = ['FILLED', 'CANCELED', 'REJECTED'];

function getReportOrders(quoteAsset, startDate, endDate) {
    startDate = startDate ? startDate : 0;
    endDate = endDate ? endDate : Date.now();
    return orderModel.findAll({
        where: {
            symbol: { [Sequelize.Op.like]: `%${quoteAsset}` },
            transactTime: { [Sequelize.Op.between]: [startDate, endDate] },
            status: 'FILLED',
            net: { [Sequelize.Op.gt]: 0 }
        },
        order: [['transactTime', 'ASC']],
        include: automationModel,
        raw: true
    })
}

function getOrders(symbol, page = 1) {
    const options = {
        where: {},
        order: [['id', 'DESC']],
        limit: PAGE_SIZE,
        offset: PAGE_SIZE * (page - 1),
        distinct: true
    };

    if (symbol) {
        if (symbol.length < 6)
            options.where = { symbol: { [Sequelize.Op.like]: `%${symbol}%` } };
        else
            options.where = { symbol };
    }

    options.include = automationModel;

    return orderModel.findAndCountAll(options);
}

function insertOrder(newOrder) {
    return orderModel.create(newOrder);
}

function getOrderById(id) {
    return orderModel.findByPk(id, { include: automationModel });
}

function getOrder(orderId, clientOrderId) {
    return orderModel.findOne({ where: { orderId, clientOrderId }, include: automationModel });
}

async function updateOrderById(id, newOrder) {
    const order = await getOrderById(id);
    return updateOrder(order, newOrder);
}

async function updateOrderByOrderId(orderId, clientOrderId, newOrder) {
    const order = await getOrder(orderId, clientOrderId);
    return updateOrder(order, newOrder);
}

async function getLastFilledOrders() {
    const idObjects = await orderModel.findAll({
        where: { status: 'FILLED' },
        group: 'symbol',
        attributes: [Sequelize.fn('max', Sequelize.col('id'))],
        raw: true
    })
    const ids = idObjects.map(o => Object.values(o)).flat();

    return orderModel.findAll({ where: { id: ids } });
}

async function removeAutomationFromOrders(automationId, transanction) {
    return orderModel.update({
        automationId: null
    }, {
        where: { automationId },
        transanction
    })
}

async function updateOrder(currentOrder, newOrder) {
    if (!currentOrder || !newOrder) return false;

    if (newOrder.status && newOrder.status !== currentOrder.status
        && FINAL_STATUS.indexOf(currentOrder.status) === -1)
        currentOrder.status = newOrder.status;

    if (newOrder.avgPrice && newOrder.avgPrice !== currentOrder.avgPrice)
        currentOrder.avgPrice = newOrder.avgPrice;

    if (newOrder.obs && newOrder.obs !== currentOrder.obs)
        currentOrder.obs = newOrder.obs;

    if (newOrder.transactTime && newOrder.transactTime > currentOrder.transactTime)
        currentOrder.transactTime = newOrder.transactTime;

    if (newOrder.commission && newOrder.commission !== currentOrder.commission)
        currentOrder.commission = newOrder.commission;

    if (newOrder.net && newOrder.net !== currentOrder.net)
        currentOrder.net = newOrder.net;

    if (newOrder.isMaker !== null && newOrder.isMaker !== undefined && newOrder.isMaker !== currentOrder.isMaker)
        currentOrder.isMaker = newOrder.isMaker;

    await currentOrder.save();
    return currentOrder;

}

const STOP_TYPES = ["STOP_LOSS", "STOP_LOSS_LIMIT", "TAKE_PROFIT", "TAKE_PROFIT_LIMIT"];

module.exports = {
    STOP_TYPES,
    insertOrder,
    getOrderById,
    getOrder,
    getOrders,
    updateOrderById,
    updateOrderByOrderId,
    getLastFilledOrders,
    getReportOrders,
    removeAutomationFromOrders
}