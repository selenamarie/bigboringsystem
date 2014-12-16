'use strict';

var services = require('./services');
var level = require('level');

var db = level('./db/profile');

exports.db = function () {
  return db;
};

exports.update = function (request, reply) {
  console.log('updating ', request.payload);
  services.profile(request, reply);
}