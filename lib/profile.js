'use strict';

var level = require('level');
var Boom = require('boom');

var services = require('./services');
var utils = require('./utils');

var db = level('./db/profile', {
  createIfMissing: true,
  valueEncoding: 'json'
});

exports.db = function () {
  return db;
};

exports.update = function (request, reply) {
  var phone = request.session.get('phone');

  db.get('user!' + phone, function (err, user) {
    if (err) {
      reply(Boom.wrap(err, 400));
    } else {
      var userData = {
        name: request.payload.name,
        websites: request.payload.websites,
        bio: request.payload.bio,
        phone: phone
      };

      user = utils.merge(user, userData);

      db.put('user!' + phone, user, function (err) {
        if (err) {
          reply(Boom.wrap(err, 400));
        } else {
          request.session.set('name', user.name);
          services.profile(request, reply, user);
        }
      });
    }
  });
}

exports.get = function (phone, next) {
  db.get('user!' + phone, function (err, user) {
    if (err) {
      next(err);
      return;
    }

    next(null, user);
  });
}