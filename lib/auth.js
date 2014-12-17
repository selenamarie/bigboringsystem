'use strict';

var uuid = require('uuid');
var profile = require('./profile');

exports.login = function (request, reply) {
  console.log('logging in')
  var phone = request.payload.phone;

  profile.db().get('user!' + phone, function (err, user) {
    if (err) {
      var uid = uuid.v4();
      profile.db().put('user!' + phone, {
        uid: uid,
        phone: phone
      }, function (err) {
        if (err) {
          throw err;
        }
        request.session.set('uid', uid);
        request.session.set('phone', phone);
        reply.redirect('/');
      });
    } else {
      request.session.set('uid', user.uid);
      request.session.set('phone', user.phone);
      request.session.set('name', user.name);
      reply.redirect('/');
    }
  });
};

exports.logout = function (request, reply) {
  request.session.reset();
  reply.redirect('/');
};