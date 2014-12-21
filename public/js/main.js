'use strict';

var socket = io();

var setUser = function () {
  if (httpRequest.readyState === 4) {
    if (httpRequest.status === 200) {
      console.log(httpRequest.responseText);
      socket.emit('user', JSON.parse(httpRequest.responseText));
      user = JSON.parse(httpRequest.responseText);
    }
  }
};

var httpRequest = new XMLHttpRequest();

httpRequest.onreadystatechange = setUser;
httpRequest.open('GET', '/user');
httpRequest.send();

document.getElementById('chat-form').onsubmit = function (event) {
  event.preventDefault();
  var message = document.querySelector('#message');
  socket.emit('message', message.value);
  message.value = '';
};

socket.on('message', function (data) {
  var chat = document.getElementById('chat');
  var p = document.createElement('p');
  p.textContent = data.name + ': ' + data.message;
  chat.appendChild(p);
});