'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const automationId = await queryInterface.rawSelect('automations', { where: {}, limit: 1 }, ['id']);
    if (!automationId) {
      return queryInterface.bulkInsert('automations', [{
        name: 'Estratégia Infalível',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:RSI_1m',
        conditions: "MEMORY['BTCUSDT:RSI_1m'].current>70",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('automations', null, {});
  }
};
