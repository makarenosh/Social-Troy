'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PublicationSchema = Schema({
    text : String,
    file : String,
    created_at : Date,
    user : {type: Schema.ObjectId, ref : 'User'},
    comments : [{type: Schema.ObjectId, ref : 'Comment'}],
    likes : [{type: Schema.ObjectId, ref : 'Like'}]
});

module.exports = mongoose.model('Publication', PublicationSchema);