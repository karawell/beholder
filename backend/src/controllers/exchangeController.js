const settingsRepository = require('../repositories/settingsRepository');

async function getBalance(req, res, next) {
    const id = res.locals.token.id;
    const settings = await settingsRepository.getDecryptedSettings(id);

    const exchange = require('../utils/exchange')(settings);

    try {
        const balance = await exchange.balance();
        res.json(balance);
    }
    catch (err) {
        console.error(err.body || err.message);
        res.status(400).json(err.body || err.message);
    }
}

module.exports = { getBalance }