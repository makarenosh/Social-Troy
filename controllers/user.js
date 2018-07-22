'use strict'

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');
var multipart = require('connect-multiparty');
var babel = require("babel-core").transform("code", {
    plugins: ["transform-async-to-generator"]
});

function home(req, res) {
    res.status(200).send({
        message: "Hola Mundo desde el servidor"
    });
}

function pruebas(req, res) {
    res.status(200).send({
        message: "Acción de pruebas desde el servidor"
    });
}

/*FUnción que guarda un nuevo usuario en la base de datos*/
function saveUser(req, res) {
    var params = req.body;
    var user = new User();
    if (params) {
        if (params.name && params.surname && params.nick && params.email && params.password) {
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.password = params.password;
            user.image = null;
            user.conected = false;
            user.role = 'ROLE_USER';
            /*Controlar usuarios duplicados*/
            User.find({
                $or: [
                    { email: user.email },
                    { nick: user.nick }
                ]
            }).exec((err, users) => {
                if (err) return res.status(500).send({ message: 'Error al guardar el usuario' });

                if (users && users.length >= 1) {
                    return res.status(200).send({ message: 'Ya existe un usuario con ese Email o Nick' })
                }
                else {
                    /*Si el usuario no existe cifra la password y guarda el nuevo usuario en la bbdd*/
                    bcrypt.hash(params.password, null, null, (err, hash) => {
                        user.password = hash;

                        user.save((err, usuarioGuardado) => {
                            if (err) return res.status(500).send({ message: 'Error al guardar el usuario' });

                            if (usuarioGuardado) {
                                res.status(200).send({ user: usuarioGuardado });
                            }
                            else {
                                res.status(404).send({ message: 'No se ha registrado el usuario' });
                            }
                        });
                    });
                }
            });


        }
        else {
            res.status(200).send({
                message: "Es necesario rellenar todos los campos necesarios para crear un nuevo usuario!!"
            });
        }
    }
    else {
        res.status(200).send({
            message: "Es necesario rellenar todos los campos necesarios para crear un nuevo usuario!!"
        });
    }

}

/*FUnción que loggea a un usuario*/
function loginUser(req, res) {
    var params = req.body;
    var email = params.email;
    var password = params.password;

    // var query = User.findOne({})
    User.findOne({ 'email': email }).exec((err, user) => {
        if (err) {
            return res.status(500).send({ message: "Error en la peticion" });
        }
        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (err) return res.status(500).send({ message: "Error en la peticion" });
                if (check) {
                    user.conected = true;
                    if (params.getToken) {
                        /*Devolver un token*/
                        //Generar el token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }
                    else {
                        /*Devolver datos del usuario*/
                        user.password = undefined;
                        return res.status(200).send({ user });
                    }
                }
                else {
                    return res.status(404).send({ message: "El usuario no se ha podido identificar." });
                }
            });
        }
        else {
            return res.status(404).send({ message: "El usuario no se ha podido identificar!!." });
        }
    });
}

/*Recupera un usuario*/
function getUser(req, res) {
    var userId = req.params.id;
    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!user) return res.status(404).send({ message: 'El usuario no existe' });
        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
    });
}

/*FUnción que devuelve los usuarios que me siguen y que sigo*/
async function followUserIds(user_id) {
    try {
        var following = await Follow.find({ "user": user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
            .then((follows) => {
                console.log(follows);
                var follows_clean = [];
                follows.forEach((follow) => {
                    follows_clean.push(follow.followed);
                });
                return follows_clean;
            })
            .catch((err) => {
                return console.log(err);
            });

        var followed = await Follow.find({ "followed": user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec()
            .then((follows) => {
                console.log(follows);
                var follows_clean = [];
                follows.forEach((follow) => {
                    follows_clean.push(follow.user);
                });
                return follows_clean;
            })
            .catch((err) => {
                return console.log(err);
            });

        return {
            following: following,
            followed: followed
        }
    }
    catch (err) {
        console.log(err);
    }
}

/*Comprueba si sigo o me sigo un usuario*/
async function followThisUser(identity_user_id, user_id) {
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id }).exec()
            .then((following) => {
                return following;
            })
            .catch((err) => {
                return handleError(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id }).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err) => {
                return handleError(err);
            });
        return {
            following: following,
            followed: followed
        }
    }
    catch (e) {
        console.log(e);
    }
}

/*Recupera los usuarios de forma paginada*/
function getUsers(req, res) {
    var identity_user_id = req.user.sub;
    var pages = req.params.pages;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, usuariosEncontrados, totalUsuarios) => {
        if (err) return res.status(500).send({ message: "Error en la petición" });
        if (!usuariosEncontrados) return res.status(404).send({ message: "No hya usuarios disponibles" });
        followUserIds(identity_user_id).then((value) => {
            var folllosObj = {
                follows: value.following,
                followsMe: value.followed
            }
            return res.status(200).send({
                usuariosEncontrados,
                totalUsuarios,
                pages: Math.ceil(totalUsuarios / itemsPerPage),
                follows: value.following,
                followsMe: value.followed
            });
        });

    });

}

/*Editar un usuario*/
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;

    /*Borrar password del objeto*/
    delete update.password;

    if (userId != req.user.sub) {
        return res.status(500).send({ message: "No tienes permisos para editar este usuario" });
    }
    User.find({
        $or: [
            { email: update.email },
            { nick: update.nick }
        ]
    }).exec((err, users) => {
        if (err) return res.status(500).send({ message: "Error al comprobar si estos datos ya están en uso" });
        console.log('USERS');
        console.log(users);
        var user_isset = false;
        users.forEach((user) => {
            console.log(user);
            console.log('user._id ---> ' + user._id + ' es igual a userID ' + userId + '???');
            if (user._id != userId) { user_isset = true; }
        });
        console.log('User_isset es ----> ' + user_isset);
        if (user_isset) return res.status(404).send({ message: "Los datos ya están en uso" });

        User.findByIdAndUpdate(userId, update, { new: true }, (err, usuarioActualizado) => {
            if (err) return res.status(500).send({ message: "Error en la petición" });
            if (!usuarioActualizado) return res.status(404).send({ message: "No se ha podido actualizar el usuario" });

            return res.status(200).send({ user: usuarioActualizado });
        });
    });

}

/*SUbir imagen de usuario*/
function uploadImage(req, res) {
    var userId = req.params.id;

    if (req.files) {
        var file_path = req.files.image.path;
        console.log(file_path);
        var file_split = file_path.split('/');

        var file_name = file_split[2];
        // console.log(file_split);
        // console.log(file_name);
        var ext_split = file_name.split('\.');
        console.log(ext_split);

        var file_ext = ext_split[1];

        if (userId != req.user.sub) {
            return removeFilesOfUploads(res, file_path, "No tienes permisos para editar este usuario");
        }

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
            /*Actualizar documento de usuario loggeado*/
            User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, usuarioActualizado) => {
                if (err) return res.status(500).send({ message: "Error en la petición" });
                if (!usuarioActualizado) return res.status(404).send({ message: "No se ha podido actualizar el usuario" });

                return res.status(200).send({ user: usuarioActualizado });
            });
        }
        else {
            return removeFilesOfUploads(res, file_path, "Extensión no válida");
        }
    }
    else {
        return res.status(200).send({ message: "No se ha ningún fichero imagen" });
    }
}

/*Elimina los ficheros a subir*/
function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({ message: message });
    });
}

/*Obitnee una imagen de la base de datos*/
function getImageFile(req, res) {
    var image_file = req.params.image;

    var path_file = './upload/users/' + image_file;
    console.log(image_file);
    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        }
        else {
            res.status(200).send({ message: "No existe la imagen" });
        }
    });
}

/*Conotador de cuantos usuarios le siguen y cuantos sigue un determinado usuario*/
function getCounters(req, res) {
    var userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }
    getCountFollow(userId).then((value) => {
        // if (err) return res.status(200).send({ err });
        return res.status(200).send({ value });
    });
}

/*Cuenta cuantos usuarios me siguen y sigo*/
async function getCountFollow(user_id) {    
    var following = await Follow.count({ 'user': user_id }).exec()
        .then((count) => {
            return count;
        })
        .catch((err) => {
            console.log(err);
        });
    var followed = await Follow.count({ 'followed': user_id }).exec()
        .then((count) => {
            return count;
        })
        .catch((err) => {
            console.log(err);
        });

    var publications = await Publication.count({ 'user': user_id }).exec()
        .then((count) => {
            console.log("HAY " + count + " PUBLICACIONES DEL USUARIO " + user_id );
            return count;
        })
        .catch((err) => {
            console.log(err);
        });

    return {
        following: following,
        followed: followed,
        publications: publications
    };
}

module.exports = {
    loginUser,
    home,
    pruebas,
    saveUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile,
    getCounters
}
