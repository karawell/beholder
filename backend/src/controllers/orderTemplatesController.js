const orderTemplateRepository = require('../repositories/orderTemplatesRepository');
const actionsRepository = require('../repositories/actionsRepository');

async function getOrderTemplate(req, res, next) {
    const id = req.params.id;
    const orderTemplate = await orderTemplateRepository.getOrderTemplate(id);
    res.json(orderTemplate);
}

async function getOrderTemplates(req, res, next) {
    const symbol = req.params.symbol;
    const page = req.query.page;
    const result = await orderTemplateRepository.getOrderTemplates(symbol, page);
    res.json(result);
}

function validatePrice(price) {
    if (!price) return true;
    if (parseFloat(price)) return true;
    return /^(MEMORY\[\'.+?\'\](\..+)*)$/i.test(price);
}

async function insertOrderTemplate(req, res, next) {
    const newOrderTemplate = req.body;

    if (!validatePrice(newOrderTemplate.limitPrice)
        || !validatePrice(newOrderTemplate.stopPrice))
        return res.status(400).json('Invalid price.');

    const orderTemplate = await orderTemplateRepository.insertOrderTemplate(newOrderTemplate);
    res.status(201).json(orderTemplate);
}

async function updateOrderTemplate(req, res, next) {
    const id = req.params.id;
    const newOrderTemplate = req.body;
    const updatedOrderTemplate = await orderTemplateRepository.updateOrderTemplate(id, newOrderTemplate);
    res.json(updatedOrderTemplate);
}

async function deleteOrderTemplate(req, res, next) {
    const id = req.params.id;

    const actions = await actionsRepository.getByOrderTemplate(id);
    if (actions.length > 0)
        return res.status(409).json(`You can't delete an Order Template used by Automations.`);

    await orderTemplateRepository.deleteOrderTemplate(id);
    res.sendStatus(204);
}

module.exports = {
    getOrderTemplate,
    getOrderTemplates,
    insertOrderTemplate,
    updateOrderTemplate,
    deleteOrderTemplate
}