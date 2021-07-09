require('dotenv').config();
module.exports = {
    development: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PWD,
        database: process.env.DB_NAME || 'beholder',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3006,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: true
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PWD,
        database: process.env.DB_NAME || 'beholder',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3006,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: true
    },
    production: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PWD,
        database: process.env.DB_NAME || 'beholder',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3006,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false
    }
}