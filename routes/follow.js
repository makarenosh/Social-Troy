'use stricr'

var express = require('express');
var FollowController = require('../controllers/follow');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir : './upload/users'});

api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getFollows);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);



module.exports = api;