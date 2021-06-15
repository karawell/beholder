function getSettings(req, res, next) {
    res.json({
        email: 'contato@luiztools.com.br'
    });
}

module.exports = { getSettings }