'use strict';

var textarea = document.querySelector('textarea');
var form = document.querySelector('form');

var qs = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

var port;


if(window.location.port !== 80){
  port = ":" + window.location.port
} else {
  port = ""
}

if(qs.replyTo){
  document.querySelector('#replyTo').value = window.location.protocol + '//' + window.location.hostname + port + '/post/' + qs.replyTo
}


var submitPost = function (e) {
  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
    form.submit();
  }
};

textarea.addEventListener('keydown', submitPost, false);