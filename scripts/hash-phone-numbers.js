var server = require('../index');
var concat = require('concat-stream');

var dbs = require('../lib/db');
var profiledb = dbs('profile');
var utils = require('../lib/utils');
var posts = require('../lib/posts');

var rs = profiledb.createReadStream({
  gte: 'user!',
  lte: 'user!\xff'
});

rs.pipe(concat(function (users) {
  console.log('starting count: ', users.length)
  var count = 0;
  users.forEach(function (user) {
    var userData = user.value;

    // if +1 doesn't exist, make it exist
    var updatedPhone = utils.phoneHash(userData.phone);
    if (updatedPhone !== userData.phone) {
      count ++;
      userData.phone = updatedPhone;

      // save new record
      profiledb.put('user!' + updatedPhone, userData);
      profiledb.put('uid!' + userData.uid, updatedPhone);

      // delete old records
      profiledb.del(user.key);
    }
  });

  console.log('ending count: ', count);
}));

rs.on('error', function (err) {
  throw err;
});
