'use strict';

var nconf = require('nconf');

var profile = require('./profile');

nconf.argv().env().file({ file: 'local.json' });

var ctx = {
  analytics: nconf.get('analytics')
};

var checkSession = function (request, reply, view, ctx) {
  if (!request.session.get('uid')) {
    reply.redirect('/');
  } else {
    reply.view(view, ctx);
  }
}

var checkUsername = function (request, reply, view, ctx) {
  if (request.session.get('uid') && !request.session.get('name')) {
    return reply.redirect('/profile');
  } else {
    reply.view(view, ctx);
  }
};

exports.home = function (request, reply) {
  ctx.error = request.query.err || '';
  ctx.session = request.session.get('uid') || false;
  checkUsername(request, reply, 'index', ctx);
};

exports.profile = function (request, reply) {
  ctx.error = request.query.err || '';
  ctx.session = request.session.get('uid') || false;

  if (request.session.get('phone')) {
    profile.get(request.session.get('phone'), function (err, user) {
      if (!err) {
        ctx.user = user;
        checkSession(request, reply, 'profile', ctx);
      }
    });
  } else {
    checkSession(request, reply, 'profile', ctx);
  }
};