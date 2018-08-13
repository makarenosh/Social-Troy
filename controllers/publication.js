'use strict';

/*Librerías*/
var path = require("path");
var fs = require("fs");
var moment = require("moment");
var mongoosePaginate = require("mongoose-pagination");
/*Modelos*/
var Publication = require("../models/publication");
var User = require("../models/user");
var Follow = require("../models/follow");
var Comment = require("../models/comment");
/*Optimización de imágenes*/
// var Jimp = require("jimp");
var sharp = require("sharp")
var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'hnxkcwaf2',
    api_key: '568424512589475',
    api_secret: '3OYwPbcU8NFeUimTYQl6U0n--K8'
});

function savePublication(req, res) {
    var params = req.body;
    if (!params.text) return res.status(200).send({ message: "Debes enviar un texto." });
    var publication = new Publication();
    publication.text = params.text;
    publication.file = null;
    publication.user = req.user.sub;
    publication.created_at = moment();
    publication.likes = [];

    publication.save((err, publicacionGuardada) => {
        if (err) return res.status(500).send({ message: "Error en la petición" });
        if (!publicacionGuardada) return res.status(404).send({ message: "La publicación no pudo guardarse!" });
        return res.status(200).send({ publicacionGuardada });
    });
}

function getPublications(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    var items_per_page = 5;

    Follow.find({ user: req.user.sub }).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: "Error al devolver seguimientos" });

        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        follows_clean.push(req.user.sub);

        Publication.find({ user: { "$in": follows_clean } }).sort('-created_at').populate('user').paginate(page, items_per_page, (err, publications, total) => {
            if (err) return res.status(500).send({ message: "Error al devolver publicaciones" });
            if (!publications || publications.length == 0) return res.status(404).send({ message: "No hay publicaciones!" });
            return res.status(200).send({ total_items: total, publications, pages: Math.ceil(total / items_per_page), page: page, items_per_page: items_per_page });
        });

    });

}

function getPublicationsUser(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var user = req.user.sub;

    if (req.params.user) {
        user = req.params.user;
    }

    var items_per_page = 5;

    Publication.find({ user: user }).sort('-created_at').populate('user').paginate(page, items_per_page, (err, publications, total) => {
        if (err) return res.status(500).send({ message: "Error al devolver publicaciones" });
        if (!publications || publications.length == 0) return res.status(404).send({ message: "No hay publicaciones!" });
        return res.status(200).send({ total_items: total, publications, pages: Math.ceil(total / items_per_page), page: page, items_per_page: items_per_page });
    });

}

function getPublication(req, res) {
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if (err) return res.status(500).send({ message: "Error en la petición" });
        if (!publication) return res.status(404).send({ message: "La publicación no existe!" });
        return res.status(200).send({ publication });
    });
}

function deletePublication(req, res) {
    var publicationId = req.params.id;
    console.log("El id de la publicación a eliminar es ---> " + publicationId);
    Publication.findByIdAndRemove(publicationId, (err, publication) => {
        if (publication.file != undefined && publication.file != null) {
            var file_path = publication.file;
            var file_split = file_path.split('/');
            var file_name = file_split[file_split.length - 1];
            var ext_split = file_name.split('\.');
            /*Aquí se consigue el id de cludinarý para poder eliminar la imagen localizándola por el id*/
            var cloudinary_id = ext_split[0];
            cloudinary.v2.uploader.destroy(cloudinary_id, function(error, result) {
                if (error) {
                    console.log(error);
                    return res.status(200).send(publication);
                }
                else {
                    console.log(result);
                    return res.status(200).send(publication);
                }
            });
        }
        if (err) return res.status(500).send({ message: "Error en la petición" });

    });
}

/*SUbir imagen de publicación*/
function uploadImage(req, res) {
    var publicationId = req.params.id;
    if (req.files) {
        console.log(req.files);
        var file_path = req.files.image.path;
        var file_split = file_path.split('/');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        var name_without_ext = ext_split[0];

        cloudinary.v2.uploader.upload(file_path, {
            transformation: [
                { width: 1000, height: 1000, crop: "limit" }
            ]
        }, function(err, result) {
            if (err) {
                console.log("No se pudo subir la imagen");
            }
            console.log("El resultado de la subida de la imagen es este de abajo ----> ");
            console.log(result);
            if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
                /*Actualizar documento de la publicación*/
                Publication.findByIdAndUpdate(publicationId, { file: result.url }, { new: true }, (err, publicacionActualizada) => {
                    if (err) return res.status(500).send({ message: "Error en la petición" });
                    if (!publicacionActualizada) return res.status(404).send({ message: "No se ha podido actualizar el usuario" });

                    return res.status(200).send({ publication: publicacionActualizada });
                });
            }
            else {
                return removeFilesOfUploads(res, file_path, "Extensión no válida");
            }
        });

    }
    else {
        return res.status(200).send({ message: "No se ha podido subir lher imagen" });
    }
}

/*Elimina los ficheros a subir*/
function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        if (err) { console.log(err); }
        return res.status(200).send({ message: message });
    });
}

/*Obitnee una imagen de la base de datos*/
function getImageFile(req, res) {
    var image_file = req.params.image;

    var path_file = './upload/publications/' + image_file;
    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        }
        else {
            res.status(200).send({ message: "No existe la imagen" });
        }
    });
}

function addComment(req, res) {
    var params = req.body;
    var comment = new Comment();
    console.log(params);
    if (params) {
        comment.text = params.text;
        comment.user = params.user;
        comment.created_at = moment();
    }

    comment.save((err, comentario)=>{
        if(err){ return res.status(500).send({message: "Error en el servidor"});}
        if(!comentario){
            return res.status(404).send({message: "El comentario no pudo guardarse"});
        }
        return res.status(200).send({comentario});
    });
}

module.exports = {
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile,
    getPublicationsUser,
    addComment
};
