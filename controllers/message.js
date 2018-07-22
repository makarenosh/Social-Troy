'use strict';

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

var reversePopulate = require('mongoose-reverse-populate');

function probando(req, res) {
    res.status(200).send({ message: 'Funciona' });
}

function saveMessage(req, res) {
    var params = req.body;
    if (!params.text || !params.receiver) {
        return res.status(200).send({ message: 'Rellena todos los campos necesarios para guardar el mensaje' });
    }
    var message = new Message();
    message.text = params.text;
    message.viewed = 'false';
    message.emiter = req.user.sub;
    console.log("El emisor es " + message.emiter);
    message.receiver = params.receiver;
    message.created_at = moment();


    // message.populate('emiter receiver', 'name surname nick _id', function(err, book){

    // });

    message.save((err, mensajeguardado) => {
        if (err) return res.status(500).send({ message: 'Error al guardar el mensaje' });
        if (!mensajeguardado) return res.status(404).send({ message: 'Error al enviar el mensaje' });

        mensajeguardado.populate('emiter receiver', 'name surname nick _id image', function(err, message) {
            if (err) return res.status(200).send({ message: 'Error al guardar el mensaje' });
            return res.status(200).send({ message:message });
        });

        
    });
}

function getUnviewedMessage(req, res) {
    var userId = req.user.sub;

    Message.count({ 'receiver': userId, 'viewed': 'false' }).exec((err, count) => {
        if (err) return res.status(500).send({ message: 'Error al guardar el mensaje' });
        if (!count) return res.status(500).send({ message: 'No hay mensajes sin leer' });

        return res.status(200).send({ 'unviewed': count });

    });
}

/*Recuopera los mensajes que tiene un usuario*/
function getReceivedMessages(req, res) {
    var userId = req.user.sub;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var items_per_page = 5;

    Message.find({ 'receiver': userId }).populate('emiter', 'name surname _id image conected').paginate(page, items_per_page, (err, messages, total) => {
        if (err) return res.status(500).send({ message: 'Error al recuperar los mensajes' });
        if (!messages) return res.status(404).send({ message: 'No hay mensajes' });
        return res.status(200).send({ total: total, pages: Math.ceil(total / items_per_page), messages });
    });
}

/*Recuopera los mensajes que tiene un usuario*/
function getSentMessages(req, res) {
    var userId = req.user.sub;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var items_per_page = 5;

    Message.find({ 'emiter': userId }).populate('emiter receiver', 'name surname nick _id conected').paginate(page, items_per_page, (err, messages, total) => {
        if (err) return res.status(500).send({ message: 'Error al recuperar los mensajes' });
        if (!messages) return res.status(404).send({ message: 'No hay mensajes' });
        return res.status(200).send({ total: total, pages: Math.ceil(total / items_per_page), messages });
    });
}

/*Recuopera los mensajes entre dos usuarios*/
function getConversation(req, res) {
    var userId = req.params.id;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var items_per_page = 10;

    Message.find({
        $or: [
            { $and: [{ 'emiter': userId }, { 'receiver': req.user.sub }] },
            { $and: [{ 'receiver': userId }, { 'emiter': req.user.sub }] }
        ]
    }).sort('-created_at').populate('emiter receiver', 'name surname nick _id image').paginate(page, items_per_page, (err, messages, total) => {
        if (err) return res.status(500).send({ message: 'Error al recuperar los mensajes' });
        if (!messages) return res.status(404).send({ message: 'No hay mensajes' });
        return res.status(200).send({ total: total, pages: Math.ceil(total / items_per_page), messages, currentPage: page });
    });

} 

function setViewedMessages(req, res) {
    var userId = req.user.sub;

    Message.update({ 'receiver': userId, 'viewed': false }, { 'viewed': 'true' }, { 'multi': true }, (err, updatedMessages) => {
        if (err) return res.status(500).send({ message: 'Error al actualizar los mensajes' });
        if (!updatedMessages) return res.status(404).send({ message: 'No se pudieron actualizar los mensajes' });
        return res.status(200).send({ messages: updatedMessages });
    });
}

module.exports = {
    probando,
    saveMessage,
    getReceivedMessages,
    getSentMessages,
    getUnviewedMessage,
    setViewedMessages,
    getConversation
};
