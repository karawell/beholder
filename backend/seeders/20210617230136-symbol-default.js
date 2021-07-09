'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultSymbol = 'BTCBUSD';
    const symbolName = await queryInterface.rawSelect('symbols', { where: { symbol: defaultSymbol } }, ['symbol']);
    if (!symbolName) {
      return queryInterface.bulkInsert('symbols', [{
        symbol: defaultSymbol,
        basePrecision: 8,
        quotePrecision: 8,
        minNotional: '0.1',
        minLotSize: '0.1',
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('symbols', null, {});
  }
};
