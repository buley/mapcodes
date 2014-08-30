var mapcodes = require('./vendor/mapcodes.js');
for (key in mapcodes) {
	if (mapcodes.hasOwnProperty(key)) {
		exports[key] = mapcodes[key];
	}
}
