'use strict';

var level = require('level');
var Boom = require('boom');
var concat = require('concat-stream');
var twitter = require('twitter-text');
var moment = require('moment');

var services = require('./services');
var utils = require('./utils');

var db = level('./db/posts', {
  createIfMissing: true,
  valueEncoding: 'json'
});

var getTime = function () {
  return Math.floor(Date.now() / 1000);
};

exports.db = function () {
  return db;
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

var setDate = function (created) {
  return moment(created * 1000).format('MMM Do, YYYY');
};

exports.getRecent = function (request, reply) {
  var uid = request.session.get('uid');

  var rs = db.createReadStream({
    gte: 'user!' + uid,
    lt: 'user!' + uid + '!\xff',
    limit: 10,
    reverse: true
  });

  rs.pipe(concat(function (posts) {
    return reply.view('posts', {
      session: request.session.get('uid'),
      posts: posts.map(function (post) {
        post.value.created = setDate(post.value.created);
        return post;
      })
    });
  }));

  rs.on('error', function (err) {
    return reply(Boom.wrap(err, 400));
  });
};

exports.getRecentForUser = function (uid, next) {
  var rs = db.createReadStream({
    gte: 'user!' + uid,
    lt: 'user!' + uid + '!\xff',
    limit: 10,
    reverse: true
  });

  rs.pipe(concat(function (posts) {
    next(null, posts);
  }));

  rs.on('error', function (err) {
    next(err);
  });
};