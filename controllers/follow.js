'use strict'

// var path = require("path");
// var fs = require("fs");
var mongoosePaginate = require("mongoose-pagination");

var User = require("../models/user");
var Follow = require("../models/follow");
var Publication = require("../models/publication");

function saveFollow(req, res) {
    var params = req.body;
    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;
    follow.save((err, followGuardado) => {
        if (err) return res.status(500).send({ message: "Error al guardar el seguimiento" });
        if (!followGuardado) return res.status(404).send({ message: "No se ha podido guardar el seguimiento;" });
        return res.status(200).send({ follows: followGuardado });
    });

}

async function followUserIds(user_id) {
    console.log("Recibido en followUserIds. EL id que he recibido es el ---> " + user_id);
    var following = await Follow.find({ 'user': user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
        .then((follows) => {
            return follows;
        })
        .catch((err) => {
            console.log(err);
        });
    var followed = await Follow.find({ 'followed': user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec()
        .then((follows) => {
            return follows;
        })
        .catch((err) => {
            console.log(err);
        });

    var following_clean = [];
    following.forEach((follow) => {
        following_clean.push(follow.followed);
    });

    var followed_clean = [];
    followed.forEach((follow) => {
        followed_clean.push(follow.user);
    });
    console.log("el primere usuario que sigo es... ");
    console.log(followed_clean[0]);

    return {
        following: following_clean,
        followed: followed_clean
    };
}

function deleteFollow(req, res) {
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({ 'user': userId, 'followed': followId }).remove(err => {
        if (err) return res.status(500).send({ message: 'Error al dejar de seguir.' });

        return res.status(200).send({ message: 'El follow se ha eliminado correctamente!' });
    });
}

function getFollowingUsers(req, res) {
    var user = req.user.sub;

    if (req.params.id && req.params.page) {
        var userId = req.params.id;
    }

    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    }
    else {
        page = req.params.id;
    }
    var itemsPerPage = 5;
    Follow.find({ user: userId }).populate('user followed').paginate(page, itemsPerPage, (err, follows, total) => {
        if (err) return res.status(500).send({ message: 'Error en el servidor' });
        if (!follows) return res.status(404).send({ message: 'No estás siguiendo a ningún usuario' });
        followUserIds(userId).then((value) => {
            console.log(value);
            // if (err) return res.status(200).send({ err });
            return res.status(200).send({ total: total, pages: Math.ceil(total / itemsPerPage), follows, users_following: value.following, users_followed: value.followed });
        });

        // return res.status(200).send({ total: total, pages: Math.ceil(total / itemsPerPage), follows });
    });

}

function getFollowedUsers(req, res) {
    var user = req.user.sub;

    if (req.params.id && req.params.page) {
        var userId = req.params.id;
    }

    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    }
    else {
        page = req.params.id;
    }
    var itemsPerPage = 5;
    Follow.find({ followed: userId }).populate('user followed').paginate(page, itemsPerPage, (err, follows, total) => {
        if (err) return res.status(500).send({ message: 'Error en el servidor' });
        if (!follows) return res.status(404).send({ message: 'No te sigue ningún usuario' });

        followUserIds(userId).then((value) => {
            return res.status(200).send({ total: total, pages: Math.ceil(total / itemsPerPage), follows, users_following: value.following, users_followed: value.followed });
        });
    });
}
/*Devolver uusarios q sigo,o los q me siguen dependiend del parametro followed*/
function getFollows(req, res) {
    var userId = req.user.sub;
    var followed = req.params.followed;
    var find = Follow.find({ user: userId });
    if (req.params.followed) {
        find = Follow.find({ followed: userId });
    }
    find.populate('user followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'Error en el servidor' });
        if (!follows) return res.status(404).send({ message: 'No sigues a ningún usuario' });

        return res.status(200).send({ follows });
    });

}

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
            console.log("HAY " + count + " PUBLICACIONES DEL USUARIO " + user_id);
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
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getFollows,
    followUserIds
};
