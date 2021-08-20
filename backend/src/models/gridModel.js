const Sequelize = require('sequelize');
const database = require('../db');
const OrderTemplateModel = require('./orderTemplateModel');

const gridModel = database.define('grid', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    automationId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    orderTemplateId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    conditions: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
})

gridModel.belongsTo(OrderTemplateModel, {
    foreignKey: 'orderTemplateId'
})

module.exports = gridModel;