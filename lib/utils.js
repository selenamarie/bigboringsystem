'use strict';

var level = require('level');
var nconf = require('nconf');
var ttl = require('level-ttl');
var twilio = require('twilio');

nconf.argv().env().file({ file: 'local.json' });

var client = twilio(nconf.get('twilioSID'), nconf.get('twilioToken'))

var db = ttl(level('./db/pins', {
  createIfMissing: true,
  valueEncoding: 'json'
}));

exports.merge = function (objA, objB) {
  for (var key in objB) {
    objA[key] = objB[key];
  }

  return objA;
};

exports.verifyPin = function (phone, pin, next) {
  db.get('pin!' + phone, function (err, foundPin) {
    if (err) {
      return next(err);
    }

    if (foundPin !== pin) {
      next(new Error('Invalid pin'));
    } else {
      db.del('pin!' + phone);
      next(null, pin);
    }
  });
};

exports.generatePin = function (phone, next) {
  var pin = Math.floor(Math.random() * (10000 - 1111 + 1) + 1111);
  console.log(pin);

  // 5 minutes max TTL
  db.put('pin!' + phone, pin, { ttl: 300000 }, function (err) {
    if (err) {
      return next(err);
    }

    client.sendMessage({
      to: phone,
      from: '+' + nconf.get('twilioNumber'),
      body: pin
    }, function (err) {
      console.error(err);
    });

    next(null, true);
  });
};
