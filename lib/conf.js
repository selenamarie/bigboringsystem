// Put this in a module so that it's only ever done one time.
// Otherwise, settings get overwritten each time, making testing
// harder.
var nconf = require('nconf');
nconf.argv().env().file({ file: 'local.json' });
module.exports = nconf;
