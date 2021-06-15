const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function doLogin(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;

    if (email === 'contato@luiztools.com.br'
        && bcrypt.compareSync(password, '$2y$12$QsX1fkYp74IaNfZLnVfiAe/5OZsQh5qf9.jm4m08Ouhc98xQrfxWO')) {
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, {
            expiresIn: parseInt(process.env.JWT_EXPIRES)
        })
        res.json({ token });
    }
    else
        res.sendStatus(401);
}

const blacklist = [];

function doLogout(req, res, next) {
    const token = req.headers['authorization'];
    blacklist.push(token);
    res.sendStatus(200);
}

function isBlacklisted(token){
    return blacklist.some(t => t === token);
}

module.exports = {
    doLogin,
    doLogout,
    isBlacklisted
}