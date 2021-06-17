'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
   return queryInterface.createTable(
    'settings',{
      id:{
          type:Sequelize.INTEGER,
          autoIncrement:true,
          allowNull: false,
          primaryKey:true
          },
          email:{
            type:Sequelize.STRING,
            allowNull:false
      
          },
          password:{
              type:Sequelize.STRING,
              allowNull:false
        
            },
            apiURL:Sequelize.STRING,
            accessKey:Sequelize.STRING,
            secretKey:Sequelize.STRING,
            createAt:Sequelize.DATE,
            updatedAt:Sequelize.DATE
          },)
        },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('settings');
  }
};
