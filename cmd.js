var mapcodes = require( __dirname + '/src/mapcodes.js');
if ( 4 === process.argv.length ) {
	console.log( mapcodes.decode( process.argv[3], process.argv[2] ) );
} else if ( 5 === process.argv.length ) {
	console.log( mapcodes.encode( process.argv[3],  process.argv[4], process.argv[2] ) );
} else {
	console.log( "To decode: node index.js $COUNTRY $CODE");
	console.log( "To encode: node index.js $COUNTRY $LAT $LNG" );
}

