'use strict';

var nconf = require('nconf');

nconf.argv().env().file({ file: 'local.json' });

var ctx = {
  analytics: nconf.get('analytics')
};

exports.home = function (request, reply) {
  ctx.error = request.query.err || '';
  reply.view('index', ctx);
};

exports.profile = function (request, reply) {
  ctx.error = request.query.err || '';
  reply.view('profile', ctx);
};