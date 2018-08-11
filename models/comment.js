'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PublicationSchema = Schema({
    text : String,
    created_at : Date,
    user : {type: Schema.ObjectId, ref : 'User'}
});

module.exports = mongoose.model('Publication', PublicationSchema);