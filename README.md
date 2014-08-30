#node-mapcodes
---
A node.js derived short address for any location on Earth.

Derived itself from the [legitimate project from map-leader Tom Tom](http://mapcodes.com).

### Encoding 

	`$` node cmd.js 'USA' 44.66838 -86.042944
	[ [ 'TMZQ.8G18', 409 ] ]

### Decoding

	`$` node cmd.js 'USA' 'TMZQ.8G18'
	{ y: 44.668361, x: -86.042921 }
