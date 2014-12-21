'use strict';

var level = require('level');
var Boom = require('boom');

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
    content: request.payload.content
  });
};