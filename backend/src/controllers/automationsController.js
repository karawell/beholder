const automationsRepository = require('../repositories/automationsRepository');
const actionsRepository = require('../repositories/actionsRepository');
const beholder = require('../beholder');
const db = require('../db');
const ordersRepository = require('../repositories/ordersRepository');
const orderTemplatesRepository = require('../repositories/orderTemplatesRepository');
const gridsRepository = require('../repositories/gridsRepository');

function validateConditions(conditions) {
    return /^(MEMORY\[\'.+?\'\](\..+?)?[><=!]+([0-9\.]+|(\'.+?\')|MEMORY\[\'.+?\'\](\..+?)?)( && )?)+$/i.test(conditions);
}

async function startAutomation(req, res, next) {
    const id = req.params.id;
    const automation = await automationsRepository.getAutomation(id);
    if (automation.isActive) return res.sendStatus(204);

    automation.isActive = true;

    if (automation.schedule) {
        //adicionar lógica no motor de agendamento
    } else
        beholder.updateBrain(automation.get({ plain: true }));

    await automation.save();

    if (automation.logs) console.log(`Automation ${automation.name} has started!`);

    res.json(automation);
}

async function stopAutomation(req, res, next) {
    const id = req.params.id;
    const automation = await automationsRepository.getAutomation(id);
    if (!automation.isActive) return res.sendStatus(204);

    automation.isActive = false;

    if (automation.schedule) {
        //remover do motor de agendamento
    }
    else
        beholder.deleteBrain(automation.get({ plain: true }));

    await automation.save();

    if (automation.logs) console.log(`Automation ${automation.name} has stopped!`);

    res.json(automation);
}

async function getAutomation(req, res, next) {
    const id = req.params.id;
    const automation = await automationsRepository.getAutomation(id);
    res.json(automation);
}

async function getAutomations(req, res, next) {
    const page = req.query.page;
    const automations = await automationsRepository.getAutomations(page);
    res.json(automations);
}

async function insertAutomation(req, res, next) {
    const newAutomation = req.body;
    const { quantity, levels } = req.query;

    if (!validateConditions(newAutomation.conditions) && !newAutomation.schedule)
        return res.status(400).json(`You need to have at least one condition per automation!`);

    if (!newAutomation.actions || newAutomation.actions.length === 0)
        return res.status(400).json(`You need to have at least one action per automation!`);

    const isGrid = newAutomation.actions[0].type === actionsRepository.actionsTypes.GRID;
    if (isGrid && (!quantity || !levels))
        return res.status(400).json(`Invalid grid params.`);

    const alreadyExists = await automationsRepository.automationExists(newAutomation.name);
    if (alreadyExists)
        return res.status(409).json(`Already exists an automation with the name ${newAutomation.name}.`);

    const transaction = await db.transaction();
    let savedAutomation, actions = [], grids = [];

    try {
        savedAutomation = await automationsRepository.insertAutomation(newAutomation, transaction);

        actions = newAutomation.actions.map(a => {
            a.automationId = savedAutomation.id;
            delete a.id;
            return a;
        })

        actions = await actionsRepository.insertActions(actions, transaction);

        if (isGrid)
            grids = await beholder.generateGrids(savedAutomation, levels, quantity, transaction);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        return res.status(500).json(err.message);
    }

    savedAutomation.actions = actions;

    if (isGrid)
        savedAutomation.grids = grids;

    if (savedAutomation.isActive) {
        if (savedAutomation.schedule) {
            //adicionar no motor de agendamento
        }
        else
            beholder.updateBrain(savedAutomation);
    }

    res.status(201).json(savedAutomation);
}

async function updateAutomation(req, res, next) {
    const id = req.params.id;
    const newAutomation = req.body;

    const { quantity, levels } = req.query;

    if (!validateConditions(newAutomation.conditions) && !newAutomation.schedule)
        return res.status(400).json(`You need to have at least one condition per automation!`);

    if (!newAutomation.actions || !newAutomation.actions.length)
        return res.status(400).json(`You need to have at least one action per automation!`);

    const isGrid = newAutomation.actions[0].type === actionsRepository.actionsTypes.GRID;
    if (isGrid && (!quantity || !levels))
        return res.status(400).json(`Invalid grid params.`);

    const actions = newAutomation.actions.map(a => {
        a.automationId = id;
        delete a.id;
        return a;
    })

    const transaction = await db.transaction();
    let updatedAutomation;

    try {
        //TODO: implementar transaction no updateAutomation
        updatedAutomation = await automationsRepository.updateAutomation(id, newAutomation);

        if (isGrid)
            await beholder.generateGrids(updatedAutomation, levels, quantity, transaction);
        else {
            await actionsRepository.deleteActions(id, transaction);
            await actionsRepository.insertActions(actions, transaction);
        }

        await transaction.commit();
    }
    catch (err) {
        console.error(err);
        await transaction.rollback();
        return res.status(500).json(err.message);
    }

    updatedAutomation = await automationsRepository.getAutomation(id);

    if (updatedAutomation.isActive) {
        if (updatedAutomation.schedule) {
            //remover agendamento antigo
            //adicionar agendamento novo
        }
        else {
            beholder.deleteBrain(updatedAutomation);
            beholder.updateBrain(updatedAutomation);
        }
    }
    else {
        if (updatedAutomation.schedule) {
            //remover agendamento antigo
        }
        else
            beholder.deleteBrain(updatedAutomation);

        res.json(updatedAutomation);
    }
}

async function deleteAutomation(req, res, next) {
    const id = req.params.id;
    const currentAutomation = await automationsRepository.getAutomation(id);

    if (currentAutomation.isActive) {
        if (updatedAutomation.schedule) {
            //remover agendamento antigo
        }
        else
            beholder.deleteBrain(currentAutomation.get({ plain: true }));
    }

    const transaction = await db.transaction();

    try {

        await ordersRepository.removeAutomationFromOrders(id, transaction);

        if (currentAutomation.actions[0].type === actionsRepository.actionsTypes.GRID) {
            await gridsRepository.deleteGrids(id, transaction);
            await orderTemplatesRepository.deleteOrderTemplates(currentAutomation.grids.map(g => g.orderTemplateId), transaction)
        }

        await actionsRepository.deleteActions(id, transaction);
        await automationsRepository.deleteAutomation(id, transaction);
        await transaction.commit();
        res.sendStatus(204);
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        return res.status(500).json(err.message);
    }
}

module.exports = {
    getAutomation,
    getAutomations,
    insertAutomation,
    updateAutomation,
    deleteAutomation,
    startAutomation,
    stopAutomation
}