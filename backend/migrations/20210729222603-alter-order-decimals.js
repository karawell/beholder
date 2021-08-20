'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.changeColumn('orders', 'avgPrice', {
      type: Sequelize.DECIMAL(18, 8)
    })

    await queryInterface.changeColumn('orders', 'net', {
      type: Sequelize.DECIMAL(18, 8)
    })

    await queryInterface.changeColumn('orderTemplates', 'limitPriceMultiplier', {
      type: Sequelize.DECIMAL(10, 2)
    })

    await queryInterface.changeColumn('orderTemplates', 'stopPriceMultiplier', {
      type: Sequelize.DECIMAL(10, 2)
    })

    await queryInterface.changeColumn('orderTemplates', 'quantityMultiplier', {
      type: Sequelize.DECIMAL(10, 2)
    })

    await queryInterface.changeColumn('orderTemplates', 'icebergQtyMultiplier', {
      type: Sequelize.DECIMAL(10, 2)
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('orders', 'avgPrice', { type: Sequelize.DECIMAL });
    await queryInterface.changeColumn('orders', 'net', { type: Sequelize.DECIMAL });
    await queryInterface.changeColumn('orderTemplates', 'limitPriceMultiplier', { type: Sequelize.DECIMAL });
    await queryInterface.changeColumn('orderTemplates', 'stopPriceMultiplier', { type: Sequelize.DECIMAL });
    await queryInterface.changeColumn('orderTemplates', 'quantityMultiplier', { type: Sequelize.DECIMAL });
    await queryInterface.changeColumn('orderTemplates', 'icebergQtyMultiplier', { type: Sequelize.DECIMAL });
  }
};
