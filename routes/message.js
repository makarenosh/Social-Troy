'use stricr'

var express = require('express');
var MessageController = require('../controllers/message');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir : './upload/users'});

api.get('/prue', md_auth.ensureAuth, MessageController.probando);
api.get('/messages/:page?', md_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/sent-messages/:page?', md_auth.ensureAuth, MessageController.getSentMessages);
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/unviewed-messages', md_auth.ensureAuth, MessageController.getUnviewedMessage);
api.get('/set-viewed-messages', md_auth.ensureAuth, MessageController.setViewedMessages);
api.get('/getConversation/:id/:page?', md_auth.ensureAuth, MessageController.getConversation);




// api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
// api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
// api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getFollows);
// api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);



module.exports = api;