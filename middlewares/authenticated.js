'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta';

exports.ensureAuth = function(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabecera de autenticación' });
    }else 
    {
        var token = req.headers.authorization.replace(/['"]+/g, '');
        var token = req.headers.authorization;
        try {
            var payload = jwt.decode(token, secret);
            if (payload.exp <= moment()) {
                return res.status(401).send({ message: 'El token ha expirado' });
            }
        }
        catch (ex) {
            console.log(ex);
            return res.status(404).send({ message: 'El token no es válido' });
        }

        req.user = payload;
        req.id = req.params.id;
        console.log("El id es ---> " + req.id);
        next();
    }



}
