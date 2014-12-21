'use strict';

var level = require('level');
var Boom = require('boom');
var concat = require('concat-stream');
var twitter = require('twitter-text');

var services = require('./services');
var utils = require('./utils');

var db = level('./db/posts', {
  createIfMissing: true,
  valueEncoding: 'json'
});

var getTime = function () {
  return Math.floor(Date.now() / 1000);
};

exports.add = function (request, reply) {
  var time = getTime();

  db.put('user!' + request.session.get('uid') + '!' + time, {
    created: time,
    content: twitter.autoLink(twitter.htmlEscape(request.payload.content))
  }, function (err, post) {
    if (err) {
      return reply(Boom.wrap(err, 400));
    }

    reply.redirect('/posts');
  });
};

exports.getRecent = function (request, reply) {
  var rs = db.createReadStream({
    limit: 10,
    reverse: true
  });

  rs.pipe(concat(function (posts) {
    return reply.view('posts', {
      session: request.session.get('uid'),
      posts: posts
    });
  }));

  rs.on('error', function (err) {
    return reply(Boom.wrap(err, 400));
  });
};