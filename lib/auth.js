'use strict';

var uuid = require('uuid');
var Boom = require('boom');
var nconf = require('nconf');

var profile = require('./profile');
var utils = require('./utils');

nconf.argv().env().file({ file: 'local.json' });

var addNewUser = function (uid, phone, request, reply) {
  profile.db().put('uid!' + uid, phone, function (err) {
    if (err) {
      return reply(Boom.wrap(err, 400));
    }

    profile.db().put('user!' + phone, {
      uid: uid,
      phone: phone,
      secondary: {}
    }, function (err) {
      if (err) {
        return reply(Boom.wrap(err, 400));
      }

      request.session.set('uid', uid);
      reply.redirect('/');
    });
  });
};

var checkAdmin = function (uid, request) {
  if (nconf.get('ops').indexOf(uid) > -1) {
    request.session.set('op', true);
    return;
  }
};

var register = function (request, reply) {
  console.log('logging in ', request.payload.phone)
  var phone = request.session.get('phone');

  profile.db().get('user!' + phone, function (err, user) {
    if (err || !user) {
      // Test secondary phone first before assuming it is a new registration
      profile.db().get('secondary!' + phone, function (err, primary) {
        if (err ||  !primary) {
          // register new user
          var uid = uuid.v4();
          addNewUser(uid, phone, request, reply);
          return;
        }

        profile.db().get('user!' + primary, function (err, user) {
          if (err) {
            // This shouldn't happen at all since attaching a secondary phone to
            // a non-existent primary means the data is faulty.
            return reply(Boom.wrap(err, 500));
          }

          checkAdmin(user.uid, request);
          request.session.set('phone', primary);
          request.session.set('uid', user.uid);
          request.session.set('name', user.name);
          return reply.redirect('/');
        });
      });
    } else {
      checkAdmin(user.uid, request);
      request.session.set('uid', user.uid);
      request.session.set('name', user.name);
      reply.redirect('/');
    }
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
