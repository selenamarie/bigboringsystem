'use strict';

var textarea = document.querySelector('textarea');
var form = document.querySelector('form');

var qs = window.queryString.parse(location.search);

var port = location.port;

if (port !== 80) {
  port = ':' + location.port;
}

if (qs.reply_to) {
  var reply_to = document.querySelector('#reply-to');
  var protocol = location.protocol;
  var hostname = location.hostname;
  var post_id = qs.reply_to;

  reply_to.value = protocol + '//' + hostname + port + '/post/' + post_id;
}

var submitPost = function (e) {
  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
    form.submit();
  }
};

textarea.addEventListener('keydown', submitPost, false);
