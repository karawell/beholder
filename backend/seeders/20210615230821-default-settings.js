'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('../src/utils/crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const settingsId = await queryInterface.rawSelect('settings', { where: {}, limit: 1 }, ['id']);
    if (!settingsId) {
      return queryInterface.bulkInsert('settings', [{
        email: 'karawell@gmail.com',
        password: bcrypt.hashSync('123159Well@'),
        apiUrl: 'https://testnet.binance.vision/api/',
        streamUrl: 'wss://testnet.binance.vision/ws/',
        accessKey: 'OKz2VurhyYezmhH1XVU9HaduSdeujhdFn0Z5oDCwtDEbgHw3B6DT72chiKE68J6L',
        secretKey: crypto.encrypt('WBOWXK2SU4AhlwPThA7Vm8QhMZ9AQvqGEDzcbFWAhlICjbbrn8WqQFAXoHQWZwTQ'),
        createdAt: new Date(),
        updatedAt: new Date()
      }])
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('settings', null, {});
  }
};
              