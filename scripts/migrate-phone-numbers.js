// consolidates phone numbers to use +1
// Run before migrating hashed numbers

var server = require('../index');
var concat = require('concat-stream');

// get all users

// check all possible matching numbers
// does this user have a name filled out? if not, we can drop the accountvar server = require('../index');
var dbs = require('../lib/db');
var profiledb = dbs('profile');

var posts = require('../lib/posts');

var sn = profiledb.createReadStream({
  gte: 'secondary!',
  lte: 'secondary!\xff'
});

sn.pipe(concat(function (secondary) {
  secondary.forEach(function (s) {
    // delete secondary - the number of people using this is likely low and it's not a big deal to add again
    profiledb.del(s.key);
  });
}));

var rs = profiledb.createReadStream({
  gte: 'user!',
  lte: 'user!\xff'
});

rs.pipe(concat(function (users) {
  console.log('starting count: ', users.length)
  var count = 0;
  users.forEach(function (user) {
    if (user.value.name) {
      // name exists, so we assume this profile is being used
      // copy data over to proper phone record
      var userData = user.value;

      // if +1 doesn't exist, make it exist
      if (userData.phone.indexOf('+1') === -1) {
        count ++;
        userData.phone = '+1' + userData.phone;

        // save new record
        profiledb.put('user!' + userData.phone, userData);
        profiledb.put('uid!' + userData.uid, userData.phone);

        // delete old records
        profiledb.del(user.key);
      }
    } else {
      // delete profile
      profile.db.del(user.key);
    }
  });

  console.log('ending count: ', count);
}));

rs.on('error', function (err) {
  throw err;
});
