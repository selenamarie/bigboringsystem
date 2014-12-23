'use strict';

var nconf = require('nconf');
var Boom = require('boom');
var twitter = require('twitter-text');

var profile = require('./profile');
var posts = require('./posts');

nconf.argv().env().file({ file: 'local.json' });

var ctx = {
  analytics: nconf.get('analytics')
};

exports.home = function (request, reply) {
  ctx.error = request.query.err || '';
  ctx.session = request.session.get('uid') || false;
  ctx.ops = nconf.get('ops') || {};

  if (ctx.ops.length > 0) {
    var count = 0;
    var users = {};

    ctx.ops.forEach(function (op) {
      profile.getByUID(op, function (err, user) {
        count ++;
        if (user) {
          users[op] = {
            uid: op,
            name: user.name
          };
        }

        if (count === ctx.ops.length) {
          ctx.ops = users;
          reply.view('index', ctx);
        }
      });
    });
  } else {
    reply.view('index', ctx);
  }
};

exports.messages = function (request, reply) {
  ctx.session = request.session.get('uid') || false;
  reply.view('messages', ctx);
};

exports.chat = function (request, reply) {
  ctx.session = request.session.get('uid') || false;
  reply.view('chat', ctx);
};

exports.authenticate = function (request, reply) {
  reply.view('authenticate', {
    error: request.query.err
  });
};

exports.user = function (request, reply) {
  var generateProtocols = function (urls) {
    return urls.map(function (url) {
      url = url.trim();

      if (!url.match(/^http/)) {
        url = 'http://' + url;
      }

      if (url.length > 9) {
        return url;
      }
    });
  };

  var uid = request.params.uid;

  profile.getByUID(uid, function (err, user) {
    if (err) {
      return reply(Boom.wrap(err, 404));
    }

    posts.getRecentForUser(uid, function (err, posts) {
      if (err) {
        return reply(Boom.wrap(err, 400));
      }

      reply.view('user', {
        user: user.name,
        websites: generateProtocols(twitter.htmlEscape(user.websites).split(',')),
        session: request.session.get('uid'),
        posts: posts,
        op: nconf.get('ops').indexOf(uid) > -1 || false
      });
    });
  });
};

exports.profile = function (request, reply) {
  var ctx = {
    error: request.query.err || '',
    session: request.session.get('uid') || false,
    op: request.session.get('op') || false,
    phone: ''
  };

  if (request.session.get('phone')) {
    profile.get(request.session.get('phone'), function (err, user) {
      if (err) {
        return reply(Boom.wrap(err, 404));
      }

      ctx.user = user;
      reply.view('profile', ctx);
    });
  } else {
    reply.view('profile', ctx);
  }
};
