'use strict';

var jwt = require('jwt-simple');
var moment = require('moment');
console.log(moment());
var secret = 'clave_secreta';

exports.createToken = function(user){
    var payload = {
      sub : user._id,
      name : user.name,
      nick : user.nick,
      surname : user.surname,
      email : user.email,
      role : user.role,
      image: user.image,
      iat : moment(),
      exp : moment().add(30, 'days')
    };
    
    return jwt.encode(payload, secret);
};