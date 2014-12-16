'use strict';

var services = require('./services');

exports.update = function (request, reply) {
  console.log('updating ', request.payload);
  services.profile(request, reply);
}