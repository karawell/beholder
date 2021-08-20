'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const orderTemplateId = await queryInterface.rawSelect('orderTemplates', { where: {}, limit: 1 }, ['id']);
    if (!orderTemplateId) {
      return queryInterface.bulkInsert('orderTemplates', [{
        name: 'Template Show',
        symbol: 'BTCUSDT',
        type: 'MARKET',
        side: 'BUY',
        limitPrice: null,
        limitPriceMultiplier: 1,
        stopPrice: null,
        stopPriceMultiplier: 1,
        quantity: 'MIN_NOTIONAL',
        quantityMultiplier: 1,
        icebergQty: null,
        icebergQtyMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('orderTemplates', null, {});
  }
};
