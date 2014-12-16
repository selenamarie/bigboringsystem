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
        uid: uid
      }, function (err) {
        if (err) {
          throw err;
        }
        request.session.set('uid', uid);
        reply.redirect('/');
      });
    } else {
      request.session.set('uid', user.uid);
      reply.redirect('/');
    }
  });
};