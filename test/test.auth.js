'use strict';

process.env.NODE_ENV = 'test';

var child = require('child_process');
var Lab = require('lab');
var nock = require('nock');
var Code = require('code');

var lab = exports.lab = Lab.script();

var server = require('../').getServer();
var auth = require('../lib/auth');
auth.setDB('./test/db/logins');

lab.test('authentication by phone number', function (done) {
  var options = {
    method: 'POST',
    url: '/login',
    payload: {
      phone: '5555555555'
    }
  };

  server.inject(options, function (response) {
    var result = response.result;
    console.log(result)
    Code.expect(response.statusCode).to.equal(302);
    done();
  });
});
