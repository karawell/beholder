const logger = require('../utils/logger');

module.exports = (error, req, res, next) => {
    logger.error(`${req.method} ${req.path} => ${error.message}`, error);
    res.status(500).json({ error: error.message });
}
