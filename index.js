'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var Boom = require('boom');

var services = require('./lib/services');
var profile = require('./lib/profile');

nconf.argv().env().file({ file: 'local.json' });

var server = new Hapi.Server();

server.connection({
  host: nconf.get('domain'),
  port: nconf.get('port')
});

server.views({
  engines: {
    jade: require('jade')
  },
  isCached: process.env.node === 'production',
  path: __dirname + '/views',
  compileOptions: {
    pretty: true
  }
});

var routes = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: services.home
    }
  },
  {
    method: 'GET',
    path: '/profile',
    config: {
      handler: services.profile
    }
  },
  {
    method: 'POST',
    path: '/profile',
    config: {
      handler: profile.update
    }
  }
];

server.route(routes);

server.route({
  path: '/{p*}',
  method: 'GET',
  handler: {
    directory: {
      path: './public',
      listing: false,
      index: false
    }
  }
});

server.ext('onPreResponse', function (request, reply) {
  var response = request.response;

  if (!response.isBoom) {
    return reply.continue();
  }

  var error = response;
  console.log(error)
  var ctx = {
    reason: (error.output.statusCode === 404 ? 'page not found' : 'something went wrong')
  };

  return reply.view('error', ctx);
});

server.register({
  register: require('crumb')
}, function (err) {
  if (err) {
    throw err;
  }
});

server.start();
