'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = Schema({
    text : String,
    created_at : Date,
    user : {type: Schema.ObjectId, ref : 'User'},
    publication : {type: Schema.ObjectId, ref : 'Publication'},
});

module.exports = mongoose.model('Comment', CommentSchema);