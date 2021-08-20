'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('symbols', 'stepSize', {
      type: Sequelize.STRING
    })

    await queryInterface.addColumn('actions', 'orderTemplateId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'orderTemplates',
        key: 'id'
      }
    })

    await queryInterface.changeColumn('orders', 'automationId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'automations',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('orders', 'automationId', { type: Sequelize.INTEGER });
    await queryInterface.removeColumn('actions', 'orderTemplateId');
    await queryInterface.removeColumn('symbols', 'stepSize');
  }
};
