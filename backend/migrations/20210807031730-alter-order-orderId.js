'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.changeColumn('orders', 'orderId', {
      type: Sequelize.BIGINT,
      allowNull: false
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('orders', 'orderId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
