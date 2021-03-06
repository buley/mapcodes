var isofullname = require('./data/isofullname.js').data();

var mapcode_cversion="1.3";
var MAX_CCODE  =541;



var entity_iso = require('./data/entity_iso.js').data();



var aliases = require('./data/aliases.js').data();
var dependency = require('./data/dependency.js').data();

var usa_from   =342
var usa_upto   =392
var ccode_usa  =409
var ind_from   =271
var ind_upto   =305
var ccode_ind  =406
var can_from   =393
var can_upto   =405
var ccode_can  =494
var aus_from   =306
var aus_upto   =314
var ccode_aus  =407
var mex_from   =233
var mex_upto   =264
var ccode_mex  =410
var bra_from   =315
var bra_upto   =341
var ccode_bra  =408
var chn_from   =496
var chn_upto   =526
var ccode_chn  =527
var rus_from   =411
var rus_upto   =493
var ccode_rus  =495
var ccode_ata  =539
var ccode_earth=540

var parents3="USA,IND,CAN,AUS,MEX,BRA,RUS,CHN,"
var parents2="US,IN,CA,AU,MX,BR,RU,CN,"

/// returns string without leading spaces and plus-signs, and trailing spaces
function trim(str) { return str.replace(/^\s+|\s+$/g, ''); }

/// return 2-letter parent country abbreviation (disam in range 1..8)
function parentname2(disam) {
	return parents2.substr(disam*3-3,2);
}

/// given a parent country abbreviation, return disam (in range 1-8) or negative if error
function parentletter(isocode) {
	var p=-1;
	var len=isocode.length;
	var srch=isocode.toUpperCase()+',';
	if (len==2) p=parents2.indexOf(srch); else if (len==3) p=parents3.indexOf(srch);
	if (p<0)
		return -2;
	return 1 + (p/(len+1));
}

/// given an ISO abbreviation, set disambiguation for future calls to iso2ccode(); returns nonzero in case of error
var disambiguate=1; // GLOBAL
function set_disambiguate(isocode) {
	var p=parentletter(isocode);
	if (p<0)
		return -2;
	disambiguate = p;
	return 0;
}

/// returns alias of ISO abbreviation (if any), or return empty
function alias2iso(isocode) {
	var rx;
	if (isocode.length==2) rx='[0-9]'+isocode; else rx=isocode;
	rx = new RegExp(rx+'=','');
console.log('AL',aliases);
	var p = aliases.search(rx);
	if (p>=0)
		return aliases.substring(p+4,p+7);
	return '';
}

/// given ISO code, return internal ccode (or negative if error)
function iso2ccode(isocode)
{
  if (typeof isocode!="string")
	return -1;

  isocode=trim(isocode).toUpperCase();

  var sep=isocode.lastIndexOf('-'); if (sep<0) sep=isocode.lastIndexOf(' ');
  if (sep>=0) {

	prefix=isocode.substring(0,sep);
	isocode=trim(isocode.substring(sep+1));

	if (isocode.length!=2 && isocode.length!=3)
		return -1;
	if (set_disambiguate(prefix))
		return -2;

	// FIRST see if the isocode is in this disambiguation
	if (isocode.length==2) {
		return iso2ccode(disambiguate+''+isocode);
	}
	else if (isocode.length==3)
	{
		var isoa=alias2iso(isocode);
		if (isoa) {
			if (isoa.charAt(0)==disambiguate)
			{
				isocode=isoa;
			}
		}
	}
  }

  if (isocode.length!=2 && isocode.length!=3)
	return -1;

  {
	var i;

	var testiso=(isocode.length==2 ? disambiguate+''+isocode : isocode);
	for(i=0;i<entity_iso.length;i++) if (testiso==entity_iso[i]) return i;

	// look for any iso2 match
	if (isocode.length==2) {
		for(i=0;i<entity_iso.length;i++)
			if (entity_iso[i].charCodeAt(0)<=57 && isocode==entity_iso[i].substring(1,3) )
				return i;
	}

	isocode=alias2iso(isocode);
	if (isocode)
		return iso2ccode(isocode);
  }

  return -1;
}

/// return parent country of ccode (just returns ccode if ccode is itself a country)
function StateParent(ccode) {
	if (ccode>=usa_from && ccode<=usa_upto) return ccode_usa;
	if (ccode>=ind_from && ccode<=ind_upto) return ccode_ind;
	if (ccode>=can_from && ccode<=can_upto) return ccode_can;
	if (ccode>=aus_from && ccode<=aus_upto) return ccode_aus;
	if (ccode>=mex_from && ccode<=mex_upto) return ccode_mex;
	if (ccode>=bra_from && ccode<=bra_upto) return ccode_bra;
	if (ccode>=rus_from && ccode<=rus_upto) return ccode_rus;
	if (ccode>=chn_from && ccode<=chn_upto) return ccode_chn;
	return -199;
}

/// return name of iso (optional keepindex=1 for bracketed aliases)
function fullname(ccode,keepindex)
{
	if (ccode<0) return;
	if ( keepindex!=1 ) {
		var idx = isofullname[ccode].indexOf(' (');
		if (idx>0)
			return isofullname[ccode].substr(0,idx);
	}
	return isofullname[ccode];
}

/// returns true iff ccode is a state
function isState(ccode) { return StateParent(ccode)>=0; }

/// returns true iff ccode is a country that has states
function hasStates(ccode) { return (ccode==ccode_usa || ccode==ccode_ind || ccode==ccode_can || ccode==ccode_aus || ccode==ccode_mex || ccode==ccode_bra || ccode==ccode_chn || ccode==ccode_rus); }

/// returns true iff x in range [minx...maxx> in millionths
function isInRange(x,minx,maxx)
{
	if (minx<=x && x<maxx) return true;
	if (x<180000000) x+=360000000; else x-=360000000;
	if (minx<=x && x<maxx) return true;
	return false;
}

/// return isocode (international=1:get full code; international=2:get shortest non-ambiguous code)
function ccode2iso(ccode,international)
{
	if (ccode>=0 && ccode<MAX_CCODE)
	{
		var n=entity_iso[ccode];
		if ( /^[0-9]/.test(n) ) n=n.substring(1);
		if (international) {
			var parent = StateParent(ccode);
			if (parent>=0) {
				if (international==2) {
					// see if n occurs multiple times, if not, don't bother with parent
					var count=0;
					var i=aliases.indexOf(n+'=');
					if (i>=0) count=2; else if (n.length==2)
					{
						for (i=0;i<entity_iso.length;i++) {
							if (entity_iso[i].substr(1)==n)
								if (entity_iso[i].charAt(0)>='0') if (entity_iso[i].charAt(0)<='9') { count++; if (count>1) break; }
					}}else{
						var i;
						for (i=0;i<entity_iso.length;i++)
							if (entity_iso[i]==n) {count++;if (count>1) break;}
					}if (count==1) return n;
				} //international==2
				return parentname2(parentletter(entity_iso[parent]))+'-'+n;
			} //parent>=0
		}
		return n;
	}
}

/// low-level routines for data access
var minx,miny,maxx,maxy; // GLOBAL
function dataFirstRecord(ccode) { return data_start[ccode]; }
function dataLastRecord(ccode) { return data_start[++ccode]-1; }
function minmaxSetup(i) {
	miny = data_miny[i];
	var d = data_maxy[i]; if (d<10) {
		var shortmaxy = [0,122309,27539,27449,149759,2681190,60119,62099,491040,86489];
		d=shortmaxy[d];
	}
	maxy = miny + d;
	minx = data_minx[i];
	maxx = minx + data_maxx[i];
}

/// return a ccode which could PROBABLY encode coordinate (y,x) in degrees; preferred_ccode is returned if possible; returns "Worldwide" if all else fails;
function find_bestiso(y,x,preferred_ccode)
{
	var ox=Math.round(x*1000000);
	var oy=Math.round(y*1000000);

	var run;
	for (run=0;run<=1;run++)
	{
		var i;
		for(i=0;i<ccode_earth;i++)
		{
			if (run==0 && preferred_ccode && preferred_ccode>=0 && preferred_ccode<=ccode_earth)
				i=preferred_ccode;

			var upto = dataLastRecord(i);
			minmaxSetup(upto); // find encompassing rect
			if ( oy>=miny && oy<maxy && isInRange(ox,minx,maxx) )
				return i;
			if (run==0) break;
		}
	}
	return ccode_earth;
}

/// low-level tables for mapcode encoding and decosing
var xdivider19 = [
		  360,  360,  360,  360,  360,  360,  361,  361,  361,  361,	//  5.2429 degrees
		  362,  362,  362,  363,  363,  363,  364,  364,  365,  366,	// 10.4858 degrees
		  366,  367,  367,  368,  369,  370,  370,  371,  372,  373,	// 15.7286 degrees
		  374,  375,  376,  377,  378,  379,  380,  382,  383,  384,	// 20.9715 degrees
		  386,  387,  388,  390,  391,  393,  394,  396,  398,  399,	// 26.2144 degrees
		  401,  403,  405,  407,  409,  411,  413,  415,  417,  420,	// 31.4573 degrees
		  422,  424,  427,  429,  432,  435,  437,  440,  443,  446,	// 36.7002 degrees
		  449,  452,  455,  459,  462,  465,  469,  473,  476,  480,	// 41.9430 degrees
		  484,  488,  492,  496,  501,  505,  510,  515,  520,  525,	// 47.1859 degrees
		  530,  535,  540,  546,  552,  558,  564,  570,  577,  583,	// 52.4288 degrees
		  590,  598,  605,  612,  620,  628,  637,  645,  654,  664,	// 57.6717 degrees
		  673,  683,  693,  704,  715,  726,  738,  751,  763,  777,	// 62.9146 degrees
		  791,  805,  820,  836,  852,  869,  887,  906,  925,  946,	// 68.1574 degrees
		  968,  990, 1014, 1039, 1066, 1094, 1123, 1154, 1187, 1223,	// 73.4003 degrees
		 1260, 1300, 1343, 1389, 1438, 1490, 1547, 1609, 1676, 1749,	// 78.6432 degrees
		 1828, 1916, 2012, 2118, 2237, 2370, 2521, 2691, 2887, 3114,	// 83.8861 degrees
		 3380, 3696, 4077, 4547, 5139, 5910, 6952, 8443,10747,14784,	// 89.1290 degrees
		 23681,59485 ];

var nc = [ 1, 31, 961, 29791, 923521, 28629151, 887503681 ]
var xside = [ 0, 5,  31,  168,    961,    168*31,     29791,       165869,         923521,        5141947,         28629151 ]
var yside = [ 0, 6,  31,  176,    961,    176*31,     29791,       165869,         923521,        5141947,         28629151 ]

var decode_chars = require('./data/decode_chars.js').data();
var encode_chars = require('./data/encode_chars.js').data();

function x_divider(miny,maxy)
{
  if (miny>=0)
	return xdivider19[ (miny)>>19 ];
  if (maxy>=0)
    return xdivider19[0];
  return xdivider19[ (-maxy)>>19 ];
}

/// lowest level encode/decode routines
function fast_decode(code)
{
  var value = 0;
  var i;
  for ( i=0; i<code.length; i++ )
  {
    var c = code.charCodeAt(i);
	if ( c==46 ) // dot!
	  return value;
	if ( decode_chars[c]<0 )
	  return NaN;
	value = value*31 + decode_chars[c];
  }
  return value;
}


function decode_triple(result)
{
  var triplex,tripley;
  var c1 = decode_chars[ result.charCodeAt(0) ];
  var x = fast_decode( result.substr(1) );
  if ( c1<24 ) {
    triplex =           (c1%6) * 28 + Math.floor(x/34);
    tripley = Math.floor(c1/6) * 34 + Math.floor(x%34);
  }
  else {
    tripley = (x%40) + 136;
    triplex = Math.floor(x/40) + 24*(c1-24);
  }
  return { y:tripley , x:triplex }
}

function decode6(v,width,height)
{
	var D=6;
	var col = Math.floor(v/(height*6));
	var maxcol = Math.floor((width-4)/6);
	if ( col>=maxcol )
	{
		col=maxcol;
		D = width-maxcol*6;
	}
	var w = v - (col * height * 6 );
	var x6 = col*6 + (w%D);
	var y6 = height-1 - Math.floor(w/D);
	return { y:y6 , x:x6 }
}

function encode6(x,y,width,height)
{
	var D=6;
	var col = Math.floor(x/6);
	var maxcol = Math.floor((width-4)/6);
	if ( col>=maxcol )
	{
		col=maxcol;
		D = width-maxcol*6;
	}
	return (height * 6 * col) + (height-1-y)*D + (x-col*6);
}

/// high-precision extension routines
var use_high_precision=0; // nr of letters of high-precision postfix (if any) // GLOBAL
var extrapostfix=''; // GLOBAL
function addpostfix(result,extrax4,extray,dividerx4,dividery)
{
	if (!use_high_precision)
		return result;

	var gx = Math.floor((30*extrax4)/dividerx4);
	var gy = Math.floor((30*extray )/dividery );
	var x1=Math.floor(gx/6); var x2=(gx%6);
	var y1=Math.floor(gy/5); var y2=(gy%5);

	extrapostfix=encode_chars[ y1*5+x1 ]; if (use_high_precision==2) extrapostfix+=encode_chars[ y2*6+x2 ];
	return result+'-'+extrapostfix;
}

function add2res(y,x,dividerx4,dividery,ydirection,orginput) // returns millionths
{
	var extrax,extray;
	if (extrapostfix.length>0) {
		var c1 = extrapostfix.charCodeAt(0);
		c1 = decode_chars[c1];
		if (c1<0) c1=0; else if (c1>29) c1=29;
		var y1 = Math.floor(c1/5); var x1 = (c1%5);
		var c2 = (extrapostfix.length==2) ? extrapostfix.charCodeAt(1) : 72; // 72='H'=code 15=(3+2*6)
		c2 = decode_chars[c2];
		if (c2<0) c2=0; else if (c2>29) c2=29;
		var y2 = Math.floor(c2/6); var x2 = (c2%6);

		extrax = Math.floor( ((x1*12 + 2*x2 + 1)*dividerx4+120)/240);
		extray = Math.floor( ((y1*10 + 2*y2 + 1)*dividery  +30)/ 60);
	}
	else {
		extrax = Math.floor(dividerx4/8);
		extray = Math.floor(dividery/2);
	}

	x += extrax;
	y += extray*ydirection;
	return { y:y , x:x }
}




var zonedata='?'; //	zonedata=?|0|1|array, 0=want zone/dot, 1=want zone/dot/letter, array=res [minx miny maxx maxy,...] set when decoding/encoding // GLOBAL
var zonebase; //	zonebase=mapcode base for zone (set iff zonedata=0/1) // GLOBAL
function addzonedata(rely,relx,ygridsize,xgridsize,RESULT,ccode,c1,dividerx,dividery) // returns millionths
{
	zonedata = [rely,relx,rely+ygridsize,relx+xgridsize,RESULT+(RESULT.indexOf('.')<0 ? '.' : '')+(c1<0 ? '' : encode_chars[c1]),ccode];
	if (c1>=0) {
		var dx,dy;
		var nx,ny;
		if ( c1<24 ) {
			nx =           (c1%6) * 28; dx=28;
			ny = Math.floor(c1/6) * 34; dy=34;
		}
		else {
			nx = 24*(c1-24); dx=24;
			ny = 136;  dy=40;
		}

		zonedata[6] = rely+ygridsize-((ny+dy)*dividery);
		zonedata[7] = relx+(nx*dividerx);
		zonedata[8] = rely+ygridsize-((ny   )*dividery);
		zonedata[9] = relx+((nx+dx)*dividerx);
		return { y:(zonedata[6]+zonedata[8])/2, x:(zonedata[7]+zonedata[9])/2 };
	} else {
		return { y:(rely+ygridsize/2), x:(relx+xgridsize/2) };
	}
}

function decode_grid( result, minx,miny,maxx,maxy, pipe,ccode,m ) // for a well-formed result, and integer variables // returns millionths
{
  var relx,rely;
  var orgresult=result;
  var codexlen = result.length - 1;
  var dc = result.indexOf('.');
  if (dc==1 && codexlen==5) {
	dc++; result=result.charAt(0)+result.charAt(2)+'.'+result.substring(3);
  }
  var codexlow = codexlen-dc;
  var codex = 10*dc + codexlow;

		divy = smartdiv(m);
		if (divy==1) {divx = xside[dc];divy = yside[dc];} else divx = Math.floor( nc[dc] / divy );

  if ( dc==4 && divx==xside[4] && divy==yside[4] )
  {
    result = result.charAt(0) + result.charAt(2) + result.charAt(1) + result.substr(3);
  }

  var v = fast_decode(result);

  if ( divx!=divy && codex>24 ) // D==6
  {
		var d = decode6(v,divx,divy);
		relx=d.x;
		rely=d.y;
  }
  else
  {
		relx=Math.floor(v/divy);
		rely=v % divy;
		rely=divy-1-rely;
  }

	var ygridsize = Math.floor((maxy-miny+divy-1)/divy);
	var xgridsize = Math.floor((maxx-minx+divx-1)/divx);

	rely = miny + (rely*ygridsize);
	relx = minx + (relx*xgridsize);

	var dividery = Math.floor(( (((ygridsize))+yside[codexlow]-1)/yside[codexlow] ));
	var dividerx = Math.floor(( (((xgridsize))+xside[codexlow]-1)/xside[codexlow] ));

	var rest = result.substr(dc+1);

	if (zonedata==0 || zonedata==1) {
		var c1 = (zonedata==0 || rest.length!=3) ? -1 : decode_chars[rest.charCodeAt(0)];
		return addzonedata(rely,relx,dividery*yside[codexlow],dividerx*xside[codexlow],pipe+orgresult.substring(0,dc),ccode,c1,dividerx,dividery);
	}

	// decoderelative (postfix vs rely,relx)
	var difx;
	var dify;
	var nrchars = rest.length;

	if ( nrchars==3 )
	{
		var d = decode_triple(rest);
		difx=d.x; dify=d.y;
	}
	else {
		if ( nrchars==4 )
			rest = rest.charAt(0) + rest.charAt(2) + rest.charAt(1) + rest.charAt(3);
		var v = fast_decode(rest);
		difx = Math.floor( v/yside[nrchars] );
		dify = Math.floor( v%yside[nrchars] );
	}

	dify = yside[nrchars]-1-dify;

	var cornery = rely + (dify*dividery);
	var cornerx = relx + (difx*dividerx);
	return add2res( cornery,cornerx, dividerx<<2,dividery,1,pipe+result)
}



function fast_encode(value,nrchars)
{
  var result = '';
  while ( nrchars-- > 0 )
  {
    result = encode_chars[ value % 31 ] + result;
    value = Math.floor(value / 31);
  }
  return result;
}

function encode_triple(difx,dify)
{
	if ( dify < 4*34 )
		return encode_chars[   (Math.floor(difx/28)  + 6*Math.floor(dify/34)) ] +  fast_encode(  (difx%28) *34+(dify%34), 2 );
	else
		return encode_chars[    Math.floor(difx/24)  + 24                     ] +  fast_encode(  (difx%24)*40 + (dify-136) , 2 );
}


function encode_grid(m,y,x,codex,minx,miny,maxx,maxy,pipe,ccode)
{
	var orgcodex=codex; if (codex==14) codex=23;
	var dc = Math.floor(codex/10);
	var codexlow = (codex%10);
	var codexlen = dc + codexlow;

    divy = smartdiv(m);
	if (divy==1) {divx = xside[dc];divy = yside[dc];} else divx = Math.floor( nc[dc] / divy );



  var ygridsize = Math.floor((maxy-miny+divy-1)/divy);
  var rely = y-miny;
  rely = Math.floor(rely/ygridsize);
  var xgridsize = Math.floor((maxx-minx+divx-1)/divx);

  var relx = x-minx;
  if (relx<0) { x+=360000000; relx+=360000000; }
  if (relx<0)
    return NaN;
  relx = Math.floor( relx/xgridsize);
  if (relx>=divx)
    return NaN;


  if ( divx!=divy && codex>24 ) // D==6
  {
	var v = encode6(relx,rely,divx,divy);
  }
  else
  {
	var v = relx*divy + (divy-1-rely);
  }
  result = fast_encode( v, dc );


  if ( dc==4 && divx==xside[4] && divy==yside[4] )
    result = result.charAt(0) + result.charAt(2) + result.charAt(1) + result.charAt(3);

  rely = miny + (rely*ygridsize);
  relx = minx + (relx*xgridsize);

  var dividery = Math.floor( (((ygridsize))+yside[codexlow]-1)/yside[codexlow] );
  var dividerx = Math.floor( (((xgridsize))+xside[codexlow]-1)/xside[codexlow] );

  result += '.';

	// encoderelative

	var nrchars=codexlow;

	var  difx = x-relx;
	var  dify = y-rely;
	var  extrax = difx % dividerx;
	var  extray = dify % dividery;
	difx = Math.floor(difx/dividerx);
	dify = Math.floor(dify/dividery);

	dify = yside[nrchars]-1-dify;
	if ( nrchars==3 )
	{
		result += encode_triple(difx,dify);
	}
	else
	{

		var postfix = fast_encode( (difx)*yside[nrchars]+dify, nrchars );
		if ( nrchars==4 )
		{
			postfix = postfix.charAt(0) + postfix.charAt(2) + postfix.charAt(1) + postfix.charAt(3);
		}
		result += postfix;
	}
	// encoderelative

  if (orgcodex==14) {
	result = result.charAt(0)+'.'+result.charAt(1)+result.substring(3);
  }

  if (codexlow==3 || (codex==44)) if (zonedata==0 || zonedata==1) {
	var c1 = (zonedata==0 || codexlow!=3) ? -1 : decode_chars[result.charCodeAt(dc+1)];
	addzonedata(rely,relx,dividery*yside[codexlow],dividerx*xside[codexlow],pipe+result.substring(0,dc+1),ccode,c1,dividerx,dividery)
  }

  return addpostfix(pipe+result,extrax<<2,extray,dividerx<<2,dividery);
}







/// alphabet support

var MAXLANS=14;
var asc2lan = require('./data/asc2lan.js').data();


/// substitute characters in str with characters form the specified language (pass asHTML=1 to explicitly HTML-encode characters)
function showinlan(str,lan,asHTML)
{
	if (!lan) return str;

	var result='';

	// unpack for languages that do not support E and U
	if (asc2lan[lan][4]==63) { // is there no equivalent for the letter E in this language?
	  if ( str.indexOf('E')>=0 || str.indexOf('U')>=0) {
		var str2=aeu_unpack(str);
		if (str!=str2) {
			var dc=str2.indexOf('.');
			str='A'+str2;
		}
	  }
	}

	// substitute
	{
		var i;
		for (i=0;i<str.length;i++)
		{
			var c=str.charCodeAt(i);
			if (c>=65 && c<=93)
				c=asc2lan[lan][c-65];
			else if (c>=48 && c<=57)
				c=asc2lan[lan][c+26-48];

			if (asHTML)
				result+='&#'+c+';';
			else
				result+=String.fromCharCode(c);
		}
	}
	return result;
}


function to_ascii(str)
{
	var letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var result=''
	var len=str.length;
	var i;
	var trans=0;
	for(i=0;i<len;i++) {
		var c = str.charCodeAt(i);
		if (c>0 && c<127) result+=str.charAt(i); else {
			var lan;
			for (lan=0;lan<MAXLANS;lan++) {
				var nrc = asc2lan[lan].length;
				var found=0;
				var j;
				for (j=0;j<nrc;j++) {
					if (c==asc2lan[lan][j]) {
						result+=letters.charAt(j);
						found=1;
						trans=1;
						break;
					}
				}
				if (found) break;
			}
			if (!found) result+='?';
		}
	}
	return result;
}






/// low-level data access // GLOBAL
var flags,codex,codexlo,codexhi,codexlen;
var iscountry,isnameless,isuseless,pipetype,pipeletter,isSpecialShape22;

function dataSetup(i) {
	flags = data_flags[i];
	codexhi = Math.floor((flags & 31)/5);
	codexlo = ((flags & 31)%5) + 1;
	codexlen = codexlo+codexhi;
	codex = 10*codexhi + codexlo;
	iscountry  = (flags & 32);
	isnameless = (flags & 64);
	isuseless  = (flags & 512);
	isSpecialShape22 = (flags & 1024);
	pipetype   = ((flags>>5) & 12); // 4=pipe 8=plus 12=star
	if ( pipetype==4 )
		pipeletter=encode_chars[(flags>>11)&31];
	if (codex==21 && isnameless==0) { codex++; codexlo++; codexlen++; }
	minmaxSetup(i);
}

function smartdiv(i) {
	return data_special1[i];
}
function isUseless(i) {
	return data_flags[i] & 512;
}
function isNameless(i) {
	return data_flags[i] & 64;
}
function isStarpipe(i) {
	return data_flags[i] & (8<<5);
}
function CodexLen(i) {
	flags = data_flags[i];
	codexhi = Math.floor((flags & 31)/5);
	return codexhi + ((flags & 31)%5) + 1;
}
function Codex(i) {
	flags = data_flags[i];
	codexhi = Math.floor((flags & 31)/5);
	return 10*codexhi + ((flags & 31)%5) + 1;
}
function isSpecialShape(i) {
	return data_flags[i] & 1024;
}

var first_nameless_record; // GLOBAL
function count_city_coordinates_for_country(samecodex,index,firstcode)
{
	var i=index;
	while ( i>=firstcode && Codex(i)==samecodex && isNameless(i) ) i--;
	i++; first_nameless_record=i;
	var e=index;
	while ( Codex(e)==samecodex ) e++;
	e--;
	return (e-i+1);
}

// mid-level encode/decode
function encode_nameless(x,y,index,firstcode)
{
  var A = count_city_coordinates_for_country(codex,index,firstcode);
  var p = Math.floor(31/A);
  var r = (31 % A);
  var X = index - first_nameless_record;

  if (A>1)
  {
	var storage_offset=0;

	if ( codex!=21 && A<=31 )
	{
		var size=p; if (X<r) size++;
		storage_offset = (X*p + (X<r ? X : r)) * (961*961);
	}
	else if ( codex!=21 && A<62 )
	{
		if ( X < (62-A) )
		{
			storage_offset = X*(961*961);
		}
		else
		{
			storage_offset = (62-A + Math.floor((X-62+A)/2) )*(961*961);
			if ( (X+A) & 1 )
			{
				storage_offset += (16*961*31);
			}
		}
	}
	else
	{
		var BASEPOWER = (codex==21) ? 961*961 : 961*961*31;
		var BASEPOWERA = Math.floor(BASEPOWER/A);
		if (A==62)
			BASEPOWERA++;
		else
			BASEPOWERA = (961) * Math.floor(BASEPOWERA/961);

		storage_offset = X * BASEPOWERA;
	}

	var SIDE=smartdiv(index);
	var orgSIDE=SIDE;
	var xSIDE=SIDE;
	if ( isSpecialShape22 )
	{
		xSIDE *= SIDE;
		SIDE = 1+Math.floor((maxy-miny)/90);
		xSIDE = Math.floor(xSIDE/SIDE);
	}

	var dividerx4 = x_divider(miny,maxy); // 4 times too large
	var dx = Math.floor( (4*(x-minx))/dividerx4 ); // div with floating point value
	var extrax4 = (x-minx)*4 - dx*dividerx4; // mod with floating point value

	var dividery = 90;
	var dy = Math.floor( (maxy-y)/dividery );
	var extray = (maxy-y) % dividery;

	var v = storage_offset;
	if ( isSpecialShape22 )
		v += encode6(dx,SIDE-1-dy,xSIDE,SIDE);
	else
		v+= (dx*SIDE + dy);

	var result = fast_encode( v, codexlen+1 );

	if ( codexlen==3 )
	{
		result = result.substr(0,2) + '.' + result.substr(2);
	}
	else if ( codexlen==4 )
	{
		if ( codex==22 && A<62 && orgSIDE==961 && !isSpecialShape22 )
			result = result.charAt(0) + result.charAt(1) + result.charAt(3) + result.charAt(2) + result.charAt(4);
		if (codex==13)
			result = result.substr(0,2) + '.' + result.substr(2);
		else
			result = result.substr(0,3) + '.' + result.substr(3);
	}

	return addpostfix(result,extrax4,extray,dividerx4,dividery)
  }
}





function decode_nameless(result,firstrec) // returns millionths
{
	if ( codex==22 )
		result = result.substr(0,3)+result.substr(4);
	else
		result = result.substr(0,2)+result.substr(3);

	var A = count_city_coordinates_for_country(codex,firstrec,firstrec);
	if ( A<2 ) A=1; // paranoia

    var p = Math.floor(31/A);
    var r = (31 % A);
	var v;
    var X=-1;
	var swapletters=0;

	if ( codex!=21 && A<=31 )
    {
		var offset = decode_chars[ result.charCodeAt(0) ];

		if ( offset < r*(p+1) )
		{
			X = Math.floor( offset / (p+1) );
		}
		else
		{
            swapletters=(p==1 && codex==22);
			X = r + Math.floor( (offset-(r*(p+1))) / p );
		}
    }
    else if ( codex!=21 && A<62 )
    {
		X = decode_chars[ result.charCodeAt(0) ];
		if ( X < (62-A) )
		{
            swapletters=(codex==22);
		}
		else
		{
			X = X+(X-(62-A));
		}
    }
	else // codex==21 || A>=62
	{
		var BASEPOWER = (codex==21) ? 961*961 : 961*961*31;
		var BASEPOWERA = Math.floor(BASEPOWER/A);
		if (A==62) BASEPOWERA++; else BASEPOWERA = 961*Math.floor(BASEPOWERA/961);

		// decode and determine x
		v = fast_decode(result);
		X  = Math.floor(v/BASEPOWERA);
		v %= BASEPOWERA;
	}

	if (swapletters)
	{
		if ( ! isSpecialShape(firstrec+X) )
			result = result.charAt(0) + result.charAt(1) + result.charAt(3) + result.charAt(2) + result.charAt(4);
	}

	if ( codex!=21 && A<=31 )
	{
		v = fast_decode(result);
		if (X>0)
		{
			v -= ( (X*p + (X<r ? X : r)) * (961*961) );
		}
	}
	else if ( codex!=21 && A<62 )
	{
		v = fast_decode(result.substr(1));
		if ( X >= (62-A) )
			if ( v >= (16*961*31) )
			{
				v -= (16*961*31);
				X++;
			}
	}

	if (X>A) return false; // past end!
	dataSetup(firstrec+X);

	SIDE = smartdiv(firstrec+X);
	var xSIDE=SIDE;

	if ( isSpecialShape22 )
	{
		xSIDE *= SIDE;
		SIDE = 1+Math.floor((maxy-miny)/90);
		xSIDE = Math.floor(xSIDE/SIDE);
	}

	var dx,dy;
	if ( isSpecialShape22 ) {
		var d = decode6(v,xSIDE,SIDE);
		dx = d.x;
		dy = SIDE-1-d.y;
	}
	else {
		dy = (v%SIDE);
		dx = Math.floor(v/SIDE);
	}

	if ( dx >= xSIDE ) // else out-of-range!
		return false;

	var dividerx4 = x_divider(miny,maxy); // 4 times too large!
	var dividery = 90;

	var cornerx = minx + Math.floor((dx*dividerx4)/4); // FIRST multiply, THEN divide!
	var cornery = maxy - (dy*dividery);
	return add2res(cornery,cornerx, dividerx4,dividery,-1,result)
}


/// returns result, or empty if error
var first_encode_record=-1; // GLOBAL
var results = new Array; // GLOBAL

function encode_starpipe(y,x,thiscodexlen,thisindex,ccode)
{
	var starpipe_result;
	var done=false;
	var STORAGE_START=0;

	// search back to first pipe star
	var firstindex = thisindex;
	while ( isStarpipe(firstindex-1) && CodexLen(firstindex-1)==thiscodexlen )
		firstindex--;

	starpipe_result='';

	for(i=firstindex;;i++)
	{
		if (CodexLen(i)!=thiscodexlen) {
			return starpipe_result;
		}

		dataSetup(i);
		if (!done)
		{
			var H = Math.floor((maxy-miny+89)/90);
			var xdiv = x_divider(miny,maxy);
			var W = Math.floor( ( (maxx-minx)*4 + (xdiv-1) ) / xdiv );

			H = 176*Math.floor( (H+176-1)/176 );
			W = 168*Math.floor( (W+168-1)/168 );

			var product = Math.floor(W/168)*Math.floor(H/176)*961*31;

			var GOODROUNDER = codex>=23 ? (961*961*31) : (961*961);
			if ( pipetype==8 ) // *+
				product = Math.floor((STORAGE_START+product+GOODROUNDER-1)/GOODROUNDER) * GOODROUNDER - STORAGE_START;

			if ( i==thisindex )
			if ( miny<=y && y<maxy && isInRange(x,minx,maxx) )
			{
				var dividerx = Math.floor((maxx-minx+W-1)/W);
				var vx = Math.floor((x-minx)/dividerx);
				var extrax =       ((x-minx)%dividerx);

				var dividery = Math.floor((maxy-miny+H-1)/H);
				var vy = Math.floor((maxy-y)/dividery);
				var extray =       ((maxy-y)%dividery);


				var spx = vx%168;
				var spy = vy%176;

				vx = Math.floor(vx/168);
				vy = Math.floor(vy/176);

				// PIPELETTER ENCODE
				var value = (vx * Math.floor(H/176) + vy);

				starpipe_result = fast_encode( Math.floor(STORAGE_START/(961*31)) + value, codexlen-2 );
				starpipe_result += '.';
				starpipe_result += encode_triple(spx,spy);

				if (zonedata==0 || zonedata==1) {
					var c1 = (zonedata==0) ? -1 : decode_chars[starpipe_result.charCodeAt(starpipe_result.length-3)];
					addzonedata(maxy-(vy+1)*dividery*176,minx+vx*dividerx*168,176*dividery,168*dividerx,starpipe_result.substring(0,starpipe_result.length-3),ccode,c1,dividerx,dividery);
				}

				if (results.length==0) first_encode_record=i;

				starpipe_result = addpostfix(starpipe_result,extrax<<2,extray,dividerx<<2,dividery);
				done=true; // will be returned soon, but look for end of pipes
			}
			STORAGE_START += product;

		} //!done
	}
}

function decode_starpipe(input,firstindex,ccode) // returns millionths
{
	var STORAGE_START=0;
	var difx,dify;
	var thiscodexlen = codexlen;

	var value = fast_decode(input); // decode top (before dot)
	value *= (961*31);
    var triple = decode_triple( input.substr( input.length - 3 ) ); // decode bottom 3 chars

	var i;
	for(i=firstindex;;i++)
	{
		if (CodexLen(i)!=thiscodexlen) {
			return false;
		}
		if (i>firstindex) dataSetup(i);

		var H = Math.floor((maxy-miny+89)/90);
		var xdiv = x_divider(miny,maxy);
		var W = Math.floor( ( (maxx-minx)*4 + (xdiv-1) ) / xdiv );

		H = 176*Math.floor( (H+176-1)/176 );
		W = 168*Math.floor( (W+168-1)/168 );

		var product = Math.floor(W/168)*Math.floor(H/176)*961*31;

		var GOODROUNDER = codex>=23 ? (961*961*31) : (961*961);
		if ( pipetype==8 ) // *+
			product = Math.floor((STORAGE_START+product+GOODROUNDER-1)/GOODROUNDER) * GOODROUNDER - STORAGE_START;

		if ( value >= STORAGE_START && value < STORAGE_START + product ) // code belongs here?
		{
			var dividerx = Math.floor((maxx-minx+W-1)/W);
			var dividery = Math.floor((maxy-miny+H-1)/H);

			value -= STORAGE_START;
			value = Math.floor( value / (961*31) );
			// PIPELETTER DECODE
			var vx = Math.floor(value / Math.floor(H/176));
			vx = vx*168 + triple.x;
			var vy =           (value % Math.floor(H/176))*176 + triple.y;

			var cornery = maxy - vy*dividery;
			var cornerx = minx + vx*dividerx;
/* 1.28 commented out for now while looking into problem feedback
				{
					var c1 = (zonedata==0) ? -1 : decode_chars[input.charCodeAt(input.length-3)];
					var zd=addzonedata(cornery+(triple.y-176)*dividery,cornerx-triple.x*dividerx,176*dividery,168*dividerx,input.substring(0,input.length-3),ccode,c1,dividerx,dividery);
					cornery=zd.y;
					cornerx=zd.x;
				}
*/
			var retval = add2res(cornery,cornerx,dividerx<<2,dividery,-1,input);
			if ( retval.x<minx || retval.x>=maxx || retval.y<miny || retval.y>maxy )
				return false;
			return retval;
		}
		STORAGE_START += product;
	}
}




function aeu_pack(r)
{
	var dotpos=-9;
	var rlen=r.length;
	var d;
	var rest='';
	for ( d=0;d<rlen;d++ )
		if ( r.charAt(d)<'0' || r.charAt(d)>'9' ) // not digit?
		if ( r.charAt(d)=='.' && dotpos<0 ) // first dot?
			dotpos=d;
		else if ( r.charAt(d)=='-' ) {
			rest=r.substring(d);
			r=r.substring(0,d);
			rlen=d;
		}
		else
			return r; // not alldigit (or multiple dots)

	if (rlen-2 > dotpos) { // does r have a dot, AND at least 2 chars after the dot?
		var v = (r.charCodeAt(rlen-2)-48)*10+(r.charCodeAt(rlen-1)-48);
		var last  = Math.floor(v%34);
		var vowels = ['A','E','U'];
		r = r.substring(0,rlen-2) + vowels[Math.floor(v/34)] + (last<31 ? encode_chars[last] : vowels[last-31]);
	}
	return r+rest;
}

var forcecoder_encode=-1; // GLOBAL
function master_encode(orgy,orgx,ccode,isrecursive,stop_with_one_result,allowworld,state_override)
{
	if (!isrecursive) {results.length=0;first_encode_record=-1;}
	var first_result_index=results.length;

	if (isNaN(ccode) || ccode<0 || ccode>ccode_earth) ccode=ccode_earth;
	if (isNaN(orgx)) orgx=0;
	if (isNaN(orgy)) orgy=0;
	if (orgy>90) orgy-=180; else if (orgy<-90) orgy+=180;
	if (orgx>179.999999) orgx-=360; else if (orgx<-180) orgx+=180;

	var from = dataFirstRecord(ccode);
	if (!data_flags[from]) return '';	// 1.27 survive partially filled data_ array
	var upto = dataLastRecord(ccode);

	var y = Math.round(orgy*1000000);
	var x = Math.round(orgx*1000000);

	// LIMIT_TO_OUTRECT : make sure it fits the country
	if ( ccode!=ccode_earth )
	{
		minmaxSetup(upto); // find encompassing rect
		if ( ! ( miny<=y && y<maxy && isInRange(x,minx,maxx) ) ) // no fit?
		{
			if (isrecursive)
				return '';
			from=upto+1; // empty the range
		}
	}

	if (forcecoder_encode>0) { from=upto=forcecoder_encode; forcecoder_encode=-1; stop_with_one_result=true; }

	var i;
	for ( i=from; i<=upto; i++ )
	{
	  dataSetup(i);
	  if ( codex<54 ) // exlude 54 and 55
	  {
		if ( miny<=y && y<maxy && isInRange(x,minx,maxx) )
		{
				var r='';
				if (results.length==0) first_encode_record=i;
				if ( isuseless && i==upto && StateParent(ccode)>=0 ) {
					//if ( ! isrecursive ) // 1.30 always produce recursive results
					{
						master_encode(orgy,orgx,StateParent(ccode),true,stop_with_one_result,allowworld,ccode); // ccode= state override
					}
					continue;
				}
				else if (pipetype==0 && isnameless==0) {
					if (isuseless && results.length==first_result_index) {
						// RESTRICTUSELESS : ignore! nothing was found yet in non-useless records!
					}
					else
					{
						r = encode_grid(i,y,x,codex,minx,miny,maxx,maxy,'',ccode);
					}
				}
				else if (pipetype==4) {
					r = encode_grid(i,y,x,codex,minx,miny,maxx,maxy,pipeletter,ccode);
				}
				else if (isnameless) { // auto-pipe 21/22
					r = encode_nameless(x,y,i,from);
				}
				else { // pipe star, pipe plus
					r = encode_starpipe(y,x,codexlen,i,ccode);
				}

				var rlen = r.length;
				if ( rlen>4 )
				{
					r=aeu_pack(r);

					var storecode=ccode;
					if (typeof state_override != undefined)
						if(state_override>=0)
							storecode=state_override;

					results[results.length]=[r,storecode];

					if (stop_with_one_result)
						return results;


				}
		} // in rect
		}
	}

	if (allowworld)
		if (!isrecursive)
			if ( ccode!=ccode_earth )
				master_encode(orgy,orgx,ccode_earth,true,stop_with_one_result,false,-1);

	return results;
}


function aeu_unpack(str) // unpack encoded into all-digit (assume str already uppercase!)
{
	var voweled=0;
	var lastpos = str.length-1;
	var dotpos = str.indexOf('.');
	if (dotpos<2 || lastpos<dotpos+2 ) return ''; // Error: no dot, or less than 2 letters before dot, or less than 2 letters after dot

	if (str.charAt(0)=='A')
	{
		voweled=1;
		str=str.substring(1);
		dotpos--;
	}
	else
	{
		var v = str.charAt(lastpos-1);
		if (v=='A') v=0; else if (v=='E') v=34; else if (v=='U') v=68; else v=-1;
		if (v>=0)
		{
			var e = str.charAt(lastpos);
			if (e=='A') v+=31; else if (e=='E') v+=32; else if (e=='U') v+=33; else {
				var ve = decode_chars[str.charCodeAt(lastpos)];
				if (ve<0) return '';
				v+=ve;
			}
			if (v>=100) return '';
			voweled=1;
			str = str.substring(0,lastpos-1) + encode_chars[Math.floor(v/10)] + encode_chars[Math.floor(v%10)];
		}
	}

	if (dotpos<2 || dotpos>5) return '';

	for (v=0;v<=lastpos;v++) if (v!=dotpos)
		if (decode_chars[str.charCodeAt(v)]<0)
			return ''; // bad char!
		else if (voweled && decode_chars[str.charAt(v)]>9)
			return ''; // nonodigit!


	return str;
}

function master_decode(mapcode,ccode) // returns object with y and x fields, or false
{
	var result;

	var minpos=mapcode.indexOf('-');
	if (minpos>0) {
		extrapostfix=trim(mapcode.substring(minpos+1));
		mapcode=mapcode.substring(0,minpos);
	} else {
		extrapostfix='';
	}

	mapcode=trim(aeu_unpack(mapcode));
	if (mapcode=='')
		return false; // failed to decode!


	var incodexlen = mapcode.length-1;

	// *** long codes in states are handled by the country
	if (incodexlen>=9 && ccode!=ccode_earth) ccode=ccode_earth;
	else if (incodexlen>=8 && StateParent(ccode)==ccode_usa) ccode=ccode_usa;
	else if (incodexlen>=7 && StateParent(ccode)==ccode_ind) ccode=ccode_ind;
	else if (incodexlen>=8 && StateParent(ccode)==ccode_can) ccode=ccode_can;
	else if (incodexlen>=8 && StateParent(ccode)==ccode_aus) ccode=ccode_aus;
	else if (incodexlen>=7 && StateParent(ccode)==ccode_mex) ccode=ccode_mex;
	else if (incodexlen>=8 && StateParent(ccode)==ccode_bra) ccode=ccode_bra;
	else if (incodexlen>=8 && StateParent(ccode)==ccode_chn) ccode=ccode_chn;
	else if (incodexlen>=8 && StateParent(ccode)==ccode_rus) ccode=ccode_rus;

	var from = dataFirstRecord(ccode);
	if (!data_flags[from]) return false; // 1.27 survive partially filled data_ array
	var upto = dataLastRecord(ccode);

	var incodexhi = mapcode.indexOf('.');

	for ( i=from; i<=upto; i++ ) {
		dataSetup(i);
		if ( pipetype==0 && isnameless==0 && codexlen==incodexlen && codexhi==incodexhi ) {
			result=decode_grid(mapcode,minx,miny,maxx,maxy,'',ccode,i);
			// RESTRICTUSELESS
			if ( isuseless && result ) {
				var fitssomewhere=0;
				var j;for (j=upto-1;j>=from;j--) { // look in previous rects
					dataSetup(j); if (isuseless) continue;
					if ( miny<=result.y && result.y<maxy && isInRange(result.x,minx,maxx) ) { fitssomewhere=1; break; }
				}
				if (!fitssomewhere) result=0;
			}
			break;
		}
		else if ( pipetype==4 && codexlen+1==incodexlen && codexhi+1==incodexhi && pipeletter==mapcode.charAt(0) ) {
			result=decode_grid(mapcode.substr(1),minx,miny,maxx,maxy,mapcode.substr(0,1),ccode,i);
			break;
		}
		else if (isnameless && ((codex==21 && incodexlen==4 && incodexhi==2) || (codex==22 && incodexlen==5 && incodexhi==3) || (codex==13 && incodexlen==5 && incodexhi==2)) ) {
			result=decode_nameless(mapcode,i);
			break;
		}
		else if ( pipetype>4 && incodexlen==incodexhi+3 && codexlen+1==incodexlen) {
			result=decode_starpipe(mapcode,i,ccode);
			break;
		}
	}

	if (result) {
		if ( result.x>180000000) result.x-=360000000;

		// LIMIT_TO_OUTRECT : make sure it fits the country
		if ( ccode!=ccode_earth )
		{
			minmaxSetup(upto); // find encompassing rect
			var xdiv8 = x_divider(miny,maxy)/4; // should be /8 but there's some extra margin
			if ( ! ( miny-45<=result.y && result.y<maxy+45 && isInRange(result.x,minx-xdiv8,maxx+xdiv8) ) ) { // no fit?
				return false;
			}
		}
	}

	if (result) { result.x = result.x/1000000.0; result.y=result.y/1000000.0; }
	return result;
}

var data_start = require('./data/start.js').data();
var data_flags = require('./data/flags.js').data();
var data_minx = require('./data/minx.js').data();
var data_miny = require('./data/miny.js').data();
var data_maxx = require('./data/maxx.js').data();
var data_maxy = require('./data/maxy.js').data();
var data_special1 = require('./data/special1.js').data();

exports.encode = function(lat, lng, country) {
	var args = [];
	if (arguments.length > 3) {
		args = Array.prototype.slice.apply(arguments, [3]);
	}
	args.unshift(lat, lng, ("string" === typeof country) ? iso2ccode(country) : country);
	return master_encode.apply(this, args);
}

exports.decode = function(id, country) {
	var args = [];
	if (arguments.length > 2) {
		args = Array.prototype.slice.apply(arguments, [2]);
	}
	args.unshift(id, ("string" === typeof country) ? iso2ccode(country) : country);
	console.log("ARGS",args);
	return master_decode.apply(this, args);
}
