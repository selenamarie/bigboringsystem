'use strict';

// TODO(isaacs): break this up into smaller pieces.
//
// Probably there should be a single test that just does the
// db setup for all of them, since there's a lot of repeated
// code between this test and test.auth.js.
//
// Next, there should be a bit that just sets up the user accounts
// we're going to use to make posts.
//
// Then after that's done, add the bits where we make posts and
// verify that all went according to plan, and then finally a
// teardown test that deletes all the test dbs.

process.env.NODE_ENV = 'test';

// Have to do this first so that db's get set up in the test folder.
var testdb = './test/db';
var conf = require('../lib/conf');
conf.set('db', testdb);

var rimraf = require('rimraf');
var resetDB = function () {
  // delete the test DBs
  rimraf.sync(testdb);
  require('fs').mkdirSync(testdb);
};

// Reset the db's now.  Must be done *before* loading the app
// or else leveldb will freak out.
resetDB();


var db = require('../lib/db');

var Lab = require('lab');
var Code = require('code');

var lab = exports.lab = Lab.script();

var fixtures = require('./fixtures.json');

// Now load up the server itself.
var server = require('../').getServer();

// Not a very smart cookie jar, but good enough for this purpose
var deliciousDelicacies = {};

var saveCookies = function (response) {
  var sc = response.headers['set-cookie'];
  if (!sc) return;
  sc.forEach(function (cookie) {
    var kv = cookie.split(';')[0].split('=');
    var key = kv.shift();
    var val = kv.join('=');
    deliciousDelicacies[key] = val;
  });
};

var cookieHeader = function () {
  var ch = Object.keys(deliciousDelicacies).map(function (key) {
    return key + '=' + deliciousDelicacies[key];
  }).join(',');
  return ch;
};


// once tests are done, delete test db.
lab.after(function (done) {
  resetDB();
  done();
});

lab.test('successful authentication by phone number generates a PIN', function (done) {
  var options = {
    method: 'POST',
    url: '/login',
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      phone: fixtures.phone
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/authenticate');
    done();
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
        require('../lib/ban').unhammer(fixtures.phone, done);
      }
    });
  };

  postLogin();
});


lab.test('log in with valid pin', function (done) {
  var options = {
    method: 'POST',
    url: '/authenticate',
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      pin: fixtures.pin
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);
    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/');
    done();
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
    done();
  });
});

lab.test('create new post without a name', function (done) {
  var options = {
    method: 'POST',
    url: '/post',
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      reply: '',
      content: 'this should fail',
      fuzze: 'some fuzes fore goode measuries'
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);
    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/profile');
    done();
  });
});

lab.test('create new post without a session', function (done) {
  var options = {
    method: 'POST',
    url: '/post',
    headers: {
      // NO COOKIES FOR YOU
    },
    payload: {
      reply: '',
      content: 'this should fail',
      fuzze: 'some fuzes fore goode measuries'
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);
    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/');
    done();
  });
});

lab.test('add name to profile', function (done) {
  var options = {
    method: 'POST',
    url: '/profile',
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      name: 'Mx. Test',
      websites: 'http://bigboringsystem.com https://x.y.z',
      bio: 'Just a test account'
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);
    Code.expect(response.statusCode).to.equal(200);
    done();
  });
});

lab.test('create new post with session and name', function (done) {
  var options = {
    method: 'POST',
    url: '/post',
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      reply: '',
      content: 'Ye olde goode poste',
      fuzze: 'some fuzes fore goode measuries'
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);
    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/posts');
    done();
  });
});

var uid, post;
lab.test('verify post on /discover', function (done) {
  var options = {
    method: 'GET',
    url: '/discover',
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);
    var article = response.payload.split('<article>')[1];
    article = article.split('</article>')[0];

    var timeRe = new RegExp('<time>.*<a href="/post/post!([^"]+)"(.*?)</time>');
    var time = article.match(timeRe)[1];
    Code.expect(time).to.match(/^[0-9]+-[0-9a-f]+$/);

    var authorRe = new RegExp('<a href="/user/([^"]+)">Mx. Test</a>');
    Code.expect(article).to.match(authorRe);

    uid = article.match(authorRe)[1];
    post = time;

    Code.expect(article).to.match(/Ye olde goode poste/);
    // Fuzz shouldn't show up anywhere.
    Code.expect(response.payload).to.not.match(/measuries/);

    Code.expect(response.statusCode).to.equal(200);
    done();
  });
});

lab.test('make a response post', function (done) {
  var options = {
    method: 'POST',
    url: '/post',
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      reply: 'http://localhost:3000/post/post!' + post,
      content: 'Reply forthwith',
      fuzziewuzzywasabear: 'some fuzes fore goode measuries'
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);
    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/posts');
    done();
  });
});

lab.test('verify post on /discover', function (done) {
  var options = {
    method: 'GET',
    url: '/discover',
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    // verify that we have two articles now.
    Code.expect(response.payload).to.match(/Reply forthwith/);
    Code.expect(response.payload).to.match(/Ye olde goode poste/);
    Code.expect(response.statusCode).to.equal(200);
    done();
  });
});
