'use strict';

var textarea = document.querySelector('textarea');
var form = document.querySelector('form');

var querystring = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (typeof query_string[pair[0]] === 'undefined') {
      query_string[pair[0]] = pair[1];
    } else if (typeof query_string[pair[0]] === 'string') {
      var arr = [query_string[pair[0]], pair[1]];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
  return query_string;
}();

var port = window.location.port;

if (port !== 80) {
  port = ':' + window.location.port;
}

if (querystring.replyTo) {
  var replyTo = document.querySelector('#reply-to');
  var protocol = window.location.protocol;
  var hostname = window.location.hostname;
  var postId = querystring.replyTo;

  replyTo.value = protocol + '//' + hostname + port + '/post/' + postId;
}

var submitPost = function (e) {
  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
    form.submit();
  }
};

textarea.addEventListener('keydown', submitPost, false);