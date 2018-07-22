var express = require("express"),
	http = require("http"),
	app = require('./app'),
	server = http.createServer(app),
	path = require('path');
var mongoose = require('mongoose');
var port = process.env.PORT || 7000;

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});
mongoose.connect('mongodb://makareno:makareno@ds135179.mlab.com:35179/josebook', { useNewUrlParser: true }, (err, res) => {
	if (err) {
		throw err;
	}
	else {
		/*Arranco el servidor con socket.io*/
		server.listen(port, function() {
			console.log('Servidor de API Rest de Josebook funcionando correctamente en ' + process.env);
		});
		console.log('Conexion a Mongo Correcta,bbdd funcionando en el puerto ' + port);
	}
});

// server.listen(3000);

//objecto para guardar en la sesión del socket a los que se vayan conectando
var usuariosOnline = {
	usersConected : []
};

var io = require("socket.io").listen(server);
var usersConected = [];

//al conectar un usuario||socket, este evento viene predefinido por socketio
io.sockets.on('connect', function(socket) {
	//cuando el usuario conecta al chat comprobamos si está logueado
	//el parámetro es la sesión login almacenada con sessionStorage
	socket.on("loginUser", function(user) {
		console.log("se conecta el usuario " + user.name);
		if(usuariosOnline.usersConected.indexOf(user)){
			/*Si el usuario ya está conectado no se añade para no duplicar*/
			usuariosOnline.usersConected.push(user);	
			console.log("Se añade a la lista el usuario " + user.name);
		}else{
			usuariosOnline.usersConected.push(user);	
			console.log("Se añade a la lista el usuario " + user.name);
		}
		
		console.log(usuariosOnline.usersConected)
		//si existe el nombre de usuario en el chat
		// if (usuariosOnline.usersConected[user]) {
		// 	socket.emit("userInUse");
		// 	return;
		// }
		//Guardamos el nombre de usuario en la sesión del socket para este cliente
		// socket.user = user;
		//añadimos al usuario a la lista global donde almacenamos usuarios
		// usuariosOnline.usersConected[user] = socket.user;
		
		//mostramos al cliente como que se ha conectado
		// socket.emit("refreshChat", "yo", "Bienvenido " + socket.username + ", te has conectado correctamente.");
		//mostramos de forma global a todos los usuarios que un usuario
		//se acaba de conectar al chat
		// socket.broadcast.emit("refreshChat", "conectado", "El usuario " + socket.user + " se ha conectado al chat.");
		//actualizamos la lista de usuarios en el chat del lado del cliente

		socket.emit("usuariosConectados", usuariosOnline.usersConected);
		socket.broadcast.emit("usuariosConectados", usuariosOnline.usersConected);
	});

	//cuando un usuario envia un nuevo mensaje, el parámetro es el 
	//mensaje que ha escrito en la caja de texto
	socket.on('addNewMessage', function(message) {
		//pasamos un parámetro, que es el mensaje que ha escrito en el chat, 
		//ésto lo hacemos cuando el usuario pulsa el botón de enviar un nuevo mensaje al chat

		//con socket.emit, el mensaje es para mi
		socket.emit("refreshChat", message);
		//con socket.broadcast.emit, es para el resto de usuarios
		socket.broadcast.emit("refreshChat", message);
	}); 

	//cuando el usuario cierra o actualiza el navegador
	socket.on("logout", function(user) {
		if(usuariosOnline.usersConected.indexOf(user)){
			/*Si el usuario ya está conectado no se añade para no duplicar*/
			usuariosOnline.usersConected.splice(usuariosOnline.usersConected.indexOf(user), 1); 
		}else{
			
		}
		//si el usuario, por ejemplo, sin estar logueado refresca la
		//página, el typeof del socket username es undefined, y el mensaje sería 
		//El usuario undefined se ha desconectado del chat, con ésto lo evitamos
		if (typeof(socket.user) == "undefined") {
			return;
		}
		//en otro caso, eliminamos al usuario
		// delete usuariosOnline[socket.username];
		//actualizamos la lista de usuarios en el chat, zona cliente
		
		socket.emit("usuariosConectados", usuariosOnline.usersConected);
		socket.broadcast.emit("usuariosConectados", usuariosOnline.usersConected);
	}); 
});
