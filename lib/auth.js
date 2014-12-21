'use strict';

var uuid = require('uuid');
var Boom = require('boom');

var profile = require('./profile');
var utils = require('./utils');

var addNewUser = function (uid, phone, reply) {
  profile.db().put('uid!' + uid, phone, function (err) {
    if (err) {
      return reply(Boom.wrap(err, 400));
    }

    var key = utils.generateAPIKey();
    profile.db().put('user!' + phone, {
      uid: uid,
      phone: phone,
      apiKey: key
    }, function (err) {
      if (err) {
        reply(Boom.wrap(err, 400));
      } else {
        request.session.set('uid', uid);
        reply.redirect('/');
      }
    });
  });
};

var register = function (request, reply) {
  console.log('logging in ', request.payload.phone)
  var phone = request.session.get('phone');

  profile.db().get('user!' + phone, function (err, user) {
    if (err) {
      var uid = uuid.v4();
      addNewUser(uid, phone, reply);
      return;
    }

    request.session.set('uid', user.uid);
    request.session.set('name', user.name);
    reply.redirect('/');
  });
};

exports.login = function (request, reply) {
  utils.generatePin(request.payload.phone, function (err) {
    if (err) {
      return reply(Boom.wrap(err, 400));
    }

    request.session.set('phone', request.payload.phone);
    reply.redirect('/authenticate');
  });
};

exports.authenticate = function (request, reply) {
  utils.verifyPin(request.session.get('phone'), request.payload.pin, function (err, pin) {
    if (err) {
      return reply(Boom.wrap(err, 400));
    }

    register(request, reply);
  });
};

exports.logout = function (request, reply) {
  request.session.reset();
  reply.redirect('/');
};