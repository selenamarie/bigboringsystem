'use strict';

var twilio = require('twilio');
var nconf = require('nconf');
var mock = function () {
  return {
    sendMessage: function (options, next) { next(); }
  };
}
var isTest = process.env.NODE_ENV === 'test';
var isDev = process.env.npm_lifecycle_event === 'dev';

if (isTest || isDev) {
  
  module.exports = mock;

} else {

  nconf.argv().env().file({ file: 'local.json' });
  if (!nconf.get('twilioSID') || !nconf.get('twilioToken')) {
    console.error('\nTwilio Not Configured:')
    console.error('Please add twilioSID and twilioToken to your local.json config or else use `npm run dev` to run a local dev server instead\n');
    process.exit();
  }

  module.exports = twilio;

}