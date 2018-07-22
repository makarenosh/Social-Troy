'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var webp = require('webp-middleware');
var app = express();

/*cargar configuración rutas necesarias para la utiliuzacion en las peticiones http*/
// var user_routes = require('./routes/user');
// var pronostico_routes = require('./routes/pronostico');
// var path = require("path");

// var compression = require('compression');
// app.use(compression());

/*configuración e boy parser*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

/*Definición del front*/
app.use(express.static((__dirname, './front-josebook/dist/')));

/* configurar cabeceras http*/
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

/*Rutas*/
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');

app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);



/*Configuración de cabeceras HTTP*/
module.exports = app;
  
