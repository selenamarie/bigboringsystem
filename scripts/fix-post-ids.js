// fixes post ids

var server = require('../index');
var concat = require('concat-stream');

var dbs = require('../lib/db');
var postsdb = dbs('posts');

var rs = postsdb.createReadStream();

rs.pipe(concat(function (posts) {
  posts.forEach(function (post) {
    var postData = post.value;

    if (!postData.postid) {
      postData.postid = postData.created;
      postsdb.put(post.key, postData);
    }
  });
}));

rs.on('error', function (err) {
  throw err;
});
