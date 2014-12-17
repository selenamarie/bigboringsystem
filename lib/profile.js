'use strict';

var services = require('./services');
var level = require('level');

var db = level('./db/profile', {
  createIfMissing: true,
  valueEncoding: 'json'
});

exports.db = function () {
  return db;
};

exports.update = function (request, reply) {
  console.log('updating ', request.payload);
  var user = {
    name: request.payload.name,
    websites: request.payload.websites,
    bio: request.payload.bio
  };

  db.put('user!' + request.session.get('phone'), user, function (err) {
    if (err) {
      throw err;
    } else {
      request.session.set('name', user.name);
      services.profile(request, reply, user);
    }
  });
}

exports.get = function (request, reply) {
  db.get('user!' + request.session.get('phone'), function (err, user) {
    services.profile(request, reply, user);
  });
}