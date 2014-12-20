'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var Boom = require('boom');
var Joi = require('joi');

var services = require('./lib/services');
var profile = require('./lib/profile');
var auth = require('./lib/auth');

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
    handler: services.home
  },
  {
    method: 'GET',
    path: '/login',
    handler: services.home
  },
  {
    method: 'GET',
    path: '/authenticate',
    handler: services.authenticate
  },
  {
    method: 'POST',
    path: '/authenticate',
    handler: auth.authenticate,
    config: {
      validate: {
        payload: {
          pin: Joi.number().integer().min(1111).max(9999)
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/login',
    handler: auth.login,
    config: {
      validate: {
        payload: {
          phone: Joi.string().regex(/^[0-9]+$/).min(10).max(15).options({
            language: {
              label: 'phone number'
            }
          })
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/logout',
    handler: auth.logout
  },
  {
    method: 'GET',
    path: '/profile',
    handler: services.profile
  },
  {
    method: 'POST',
    path: '/profile',
    handler: profile.update,
    config: {
      validate: {
        payload: {
          name: Joi.string().min(2).max(30),
          websites: Joi.string().allow(''),
          bio: Joi.string().allow('')
        }
      }
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
  var ctx = {};

  switch (error.output.statusCode) {
    case 404:
      ctx.reason = 'page not found';
      break;
    case 403:
      ctx.reason = 'forbidden';
      break;
    case 500:
      ctx.reason = 'something went wrong';
      break;
    default:
      break;
  }

  if (ctx.reason) {
    return reply.view('error', ctx);
  } else {
    reply.redirect(request.path + '?err=' + error.output.payload.message.replace(/\s/gi, '+'));
  }
});

server.register({
  register: require('crumb')
}, function (err) {
  if (err) {
    throw err;
  }
});

var options = {
  cookieOptions: {
    password: nconf.get('cookie'),
    isSecure: false
  }
};

server.register({
  register: require('yar'),
  options: options
}, function (err) { });

server.start();
