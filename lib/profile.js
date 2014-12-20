'use strict';

var level = require('level');

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
  console.log('updating ', request.payload);
  var phone = request.session.get('phone');

  db.get('user!' + phone, function (err, user) {
    if (err) {
      throw err;
    } else {
      var userData = {
        name: request.payload.name,
        websites: request.payload.websites,
        bio: request.payload.bio
      };

      user = utils.merge(user, userData);

      db.put('user!' + phone, user, function (err) {
        if (err) {
          throw err;
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