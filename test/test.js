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
conf.set('cookie', 'testsecret');

// Set a different port than the "default", so it doesn't break
// as often if you're running a dev server and tests together.
var PORT = process.env.PORT || 8000;
conf.set('port', PORT);
var DOMAIN = process.env.DOMAIN || 'localhost';
conf.set('domain', DOMAIN);
var HOST = DOMAIN + ':' + PORT;

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
var parseCSV = require('csv-parse');

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
    url: 'http://' + HOST + '/login',
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
    url: 'http://' + HOST + '/login',
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
    url: 'http://' + HOST + '/authenticate',
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
    url: 'http://' + HOST + '/authenticate',
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
    url: 'http://' + HOST + '/post',
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
    url: 'http://' + HOST + '/post',
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
    url: 'http://' + HOST + '/profile',
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
    url: 'http://' + HOST + '/post',
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


var uid, post, replypost;
lab.test('verify post on /discover', function (done) {
  var options = {
    method: 'GET',
    url: 'http://' + HOST + '/discover',
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
    url: 'http://' + HOST + '/post',
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      reply: 'http://' + HOST + '/post/post!' + post + ' ' +
             // this isn't a valid link
             'http://' + HOST + '/post/post!12345-ab',
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
    url: 'http://' + HOST + '/discover',
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

var exportData = [];
lab.test('get json export of posts', function (done) {
  var options = {
    method: 'GET',
    url: '/profile/export.json',
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    exportData = response.result;
    Code.expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
    Code.expect(response.result.length).to.equal(2);
    done();
  });
});

lab.test('get csv export of posts', function (done) {
  var options = {
    method: 'GET',
    url: '/profile/export.csv',
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    Code.expect(response.headers['content-type']).to.equal('text/csv; charset=utf-8');
    parseCSV(response.result, { columns: true, auto_parse: true }, function (err, data) {
      Code.expect(err).to.be.null();
      Code.expect(data).to.deep.equal(exportData);
      done();
    });
  });
});

lab.test('verify post shows reply', function (done) {
  var options = {
    method: 'GET',
    url: 'http://' + HOST + '/post/post!' + post,
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    // verify that we have a link to the reply
    Code.expect(response.statusCode).to.equal(200);
    var replies = response.payload.split('<p class="reply">replies:</p>');
    replies = replies[1].split('</article>')[0];
    var re = new RegExp('<a href="/post/post!([^"]+)"');
    var match = replies.match(re);
    Code.expect(match).to.not.equal(null);
    Code.expect(match[1]).to.not.equal(post);
    replypost = match[1];

    // since we are the owner now, verify that we see the moderation forms
    var action = '/reply/replyto!' + post + '!' + replypost;
    var form = '<form method="POST" action="' + action +
               '" class="moderate">';
    Code.expect(response.payload).to.contain(form);

    // Now try as anon, should not see moderation controls
    delete options.headers.cookie;
    server.inject(options, function (response) {
      Code.expect(response.payload).to.not.contain(form);
      done();
    });
  });
});


lab.test('verify reply links to post', function (done) {
  var options = {
    method: 'GET',
    url: 'http://' + HOST + '/post/post!' + replypost,
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    // verify that the reply post links back to the original
    Code.expect(response.statusCode).to.equal(200);
    var replies = response.payload.split('in reply to:');
    replies = replies[1].split('</p>')[0];
    var re = new RegExp('/post/post!([^"\\s]+)');
    Code.expect(replies).to.match(re);
    var match = replies.match(re);
    Code.expect(match[1]).to.equal(post);
    done();
  });
});


lab.test('invalid reply post id not stored, valid should be', function (done) {
  var postdb = db('posts');
  postdb.get('replyto!12345-ab!' + replypost, function (err, replyItem) {
    // should get an error, and no replyItem here.
    Code.expect(!!err).to.equal(true);
    Code.expect(!!replyItem).to.equal(false);
    postdb.get('replyto!' + post + '!' + replypost, function (err, replyItem) {
      Code.expect(!!err).to.equal(false);
      Code.expect(!!replyItem).to.equal(true);
      done();
    });
  });
});


lab.test('delete replypost', function (done) {
  var options = {
    method: 'POST',
    url: 'http://' + HOST + '/post/post!' + replypost,
    headers: {
      cookie: cookieHeader()
    },
    payload: {
      uid: uid
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    Code.expect(response.statusCode).to.equal(302);
    Code.expect(response.headers.location).to.equal('/posts');
    done();
  });
});


lab.test('verify that replies section is gone', function (done) {
  var options = {
    method: 'GET',
    url: 'http://' + HOST + '/post/post!' + post,
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    // verify that we have a link to the reply
    Code.expect(response.statusCode).to.equal(200);

    // should not contain a 'replies' section any more.
    var replies = response.payload.split('replies:');
    Code.expect(replies.length).to.equal(1);
    done();
  });
});


lab.test('post link redirect to canonical post url', function (done) {
  var options = {
    method: 'GET',
    url: 'http://' + HOST + '/post/uid!' + uid + '!' + post,
    headers: {
      cookie: cookieHeader()
    }
  };

  server.inject(options, function (response) {
    saveCookies(response);

    Code.expect(response.statusCode).to.equal(301);
    Code.expect(response.headers.location).to.equal('/post/post!' + post);
    done();
  });
});
