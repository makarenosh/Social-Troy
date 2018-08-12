'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LikeSchema = Schema({
    created_at : Date,
    user : {type: Schema.ObjectId, ref : 'User'}
});

module.exports = mongoose.model('Like', LikeSchema);