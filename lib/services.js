'use strict';

var nconf = require('nconf');

var profile = require('./profile');

nconf.argv().env().file({ file: 'local.json' });

var ctx = {
  analytics: nconf.get('analytics')
};

exports.home = function (request, reply) {
  ctx.error = request.query.err || '';
  ctx.session = request.session.get('uid') || false;
  reply.view('index', ctx);
};

exports.messages = function (request, reply) {
  ctx.session = request.session.get('uid') || false;
  reply.view('messages', ctx);
};

exports.chat = function (request, reply) {
  ctx.session = request.session.get('uid') || false;
  reply.view('chat', ctx);
};

exports.posts = function (request, reply) {
  ctx.session = request.session.get('uid') || false;
  reply.view('posts', ctx);
};

exports.discover = function (request, reply) {
  ctx.session = request.session.get('uid') || false;
  reply.view('discover', ctx);
};

exports.authenticate = function (request, reply) {
  reply.view('authenticate', {
    error: request.query.err
  });
};

exports.profile = function (request, reply) {
  ctx.error = request.query.err || '';
  ctx.session = request.session.get('uid') || false;

  if (request.session.get('phone')) {
    profile.get(request.session.get('phone'), function (err, user) {
      if (!err) {
        ctx.user = user;
        reply.view('profile', ctx);
      }
    });
  } else {
    reply.view('profile', ctx);
  }
};