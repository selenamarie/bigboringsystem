'use strict';

var nconf = require('nconf');

nconf.argv().env().file({ file: 'local.json' });

exports.home = function (request, reply) {
  reply.view('index', {
    analytics: nconf.get('analytics')
  });
};
