'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('../src/utils/crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('settings', [{
      email: 'contato@luiztools.com.br',
      password: bcrypt.hashSync('123456'),
      apiUrl: 'https://testnet.binance.vision/api/',
      accessKey: 'OKz2VurhyYezmhH1XVU9HaduSdeujhdFn0Z5oDCwtDEbgHw3B6DT72chiKE68J6L',
      secretKey: crypto.encrypt('WBOWXK2SU4AhlwPThA7Vm8QhMZ9AQvqGEDzcbFWAhlICjbbrn8WqQFAXoHQWZwTQ'),
      createdAt: new Date(),
      updatedAt: new Date()
    }])
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('settings', null, {});
  }
};
