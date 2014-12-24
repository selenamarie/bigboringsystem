'use strict';

var textarea = document.querySelector('textarea');
var form = document.querySelector('form');

var submitPost = function (e) {
  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
    form.submit();
  }
};

textarea.addEventListener('keydown', submitPost, false);
