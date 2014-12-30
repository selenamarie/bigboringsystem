'use strict';

process.env.NODE_ENV = 'test';

var child = require('child_process');
var Lab = require('lab');
var Code = require('code');

var lab = exports.lab = Lab.script();

var fixtures = require('./fixtures.json');
var server = require('../').getServer();
var auth = require('../lib/auth');
auth.setDB('./test/db/logins');
var ban = require('../lib/ban');
ban.setDB('./test/db/bans');

// delete all test dbs
var resetDB = function (cb) {
  child.exec('rm -rf ./test/db/bans ./test/db/logins', function () {
    cb();
  });
}

lab.test('successful authentication by phone number generates a PIN', function (done) {
  var options = {
    method: 'POST',
    url: '/login',
    payload: {
      phone: fixtures.phone
    }
  };

  server.inject(options, function (response) {
    var result = response.result;

    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/authenticate');
    resetDB(done);
  });
});

lab.test('unsuccessful authentication by multiple login attempts', function (done) {
  var options = {
    method: 'POST',
    url: '/login',
    payload: {
      phone: fixtures.phone
    }
  };

  var count = 1;

  function postLogin() {
    server.inject(options, function (response) {
      Code.expect(response.statusCode).to.equal(302);

      if (count <= 3) {
        Code.expect(response.headers.location).to.equal('/authenticate');
        postLogin();
        count ++;
      } else {
        Code.expect(response.headers.location).to.equal('/login?err=Your+number+has+been+banned.+Please+contact+an+operator.');
        resetDB(done);
      }
    });
  };

  postLogin();
});

lab.test('authenticate with a valid PIN', function (done) {
  var options = {
    method: 'POST',
    url: '/authenticate',
    payload: {
      pin: fixtures.pin
    }
  };

  server.inject(options, function (response) {
    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/');
    resetDB(done);
  });
});

lab.test('authenticate with an invalid PIN', function (done) {
  var options = {
    method: 'POST',
    url: '/authenticate',
    payload: {
      pin: '0000'
    }
  };

  server.inject(options, function (response) {
    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/authenticate?err=Invalid+pin');
    resetDB(done);
  });
});
