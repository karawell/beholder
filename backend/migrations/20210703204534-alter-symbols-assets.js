'use strict';
const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('symbols', 'base', Sequelize.STRING)
    await queryInterface.addColumn('symbols', 'quote', Sequelize.STRING)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('symbols', 'quote');
    await queryInterface.removeColumn('symbols', 'base');
  }
};
