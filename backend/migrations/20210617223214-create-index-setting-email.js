'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.addIndex('settings', ['email'], {
      name: 'settings_emails_index',
      unique: true
    })
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.removeIndex('settings', 'settings_emails_index');
  }
};
