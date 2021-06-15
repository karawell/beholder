const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


function doLogin(req,res,next){

    const email = req.body.email;
    const password = req.body.password;
    if(email == 'contato@luiztools.com.br'
    && bcrypt.compareSync(password, '$2y$12$D1kdpGqNh33WGaHP6HdGnuhDhN.JfuswcqDtmcyAud4onSYJaua9G' )){
      const token =  jwt.sign({ id: 1},process.env.JWT_SECRET, 
            expiresIn: parseInt(process.env.JWT_EXPIRES)
          })
        req.json({token});  
     
    else{
        req.sendStatus(401);
    }    

}

function doLogout(req,res,next){

    

}


modules.exports = {
doLogin,
doLogout

}