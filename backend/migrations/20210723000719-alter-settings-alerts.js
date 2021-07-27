'use strict';
const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('settings', 'phone', Sequelize.STRING);
    await queryInterface.addColumn('settings', 'sendGridKey', Sequelize.STRING);
    await queryInterface.addColumn('settings', 'twilioSid', Sequelize.STRING);
    await queryInterface.addColumn('settings', 'twilioToken', Sequelize.STRING)
    await queryInterface.addColumn('settings', 'twilioPhone', Sequelize.STRING)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('settings', 'phone');
    await queryInterface.removeColumn('settings', 'sendGridKey');
    await queryInterface.removeColumn('settings', 'twilioSid');
    await queryInterface.removeColumn('settings', 'twilioToken');
    await queryInterface.removeColumn('settings', 'twilioPhone');
  }
};
