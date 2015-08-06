////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

console.log('');
console.log('');
console.log('');
console.log('\t+-+-+-+-+-+-+');
console.log('\t N O D E L A');
console.log('\t+-+-+-+-+-+-+');
console.log('');
console.log('');
console.log('');

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

var rolandPortName = 'usbserial';

var sys = require('sys')
var childProcess = require('child_process');
var serialport = require('serialport');

var portname = undefined;
var myPort = undefined;

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

var http_port = 8080;

var filePath = __dirname + '/www';

var http = require('http');
var fs = require('fs');

// create the HTTP server to serve the file
var my_HTTPServer = http.createServer(function (request, response) {
  if(request.url==='/') request.url = '/index.html';

  fs.readFile(filePath + request.url, function (error, my_HTML) {

    if(error) {
      my_HTML = JSON.stringify(error);
    }
    response.writeHead(200);
    response.write(my_HTML);
    response.end();
  });
});

my_HTTPServer.listen(http_port);

console.log('HTTP server started at "http://localhost:' + http_port+'"');
console.log('');
console.log('To quit, close this terminal window');

var ws = require('ws');

var execTemp = childProcess.exec;
var tempCommand = 'open';
execTemp(tempCommand+' http://localhost:'+http_port,function(err,stdin,stdout){
	if(err) {
		console.log('');
		console.log('Error opening a browser window...');
		console.log('Please open a browser and go to "http://localhost:'+http_port+'"');
	}
});

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

var WebSocketServer = require('ws').Server;
var socketServer = new WebSocketServer({'server':my_HTTPServer});

var theSocket = undefined;

socketServer.on('connection',function(socket){

	if(theSocket===undefined){

		theSocket = socket;

		// alert the socket of our connection status
		var portConnected = false;
		if(myPort) portConnected = true;
		var msg = {
			'type' : 'connection',
			'data' : portConnected
		};

		theSocket.send(JSON.stringify(msg));


		theSocket.on('message',function(data){
			data = JSON.parse(data);
			if(data.type && handlers[data.type] && typeof handlers[data.type]==='function'){
				var response = handlers[data.type](data.data);
				if(response){
					try{
						socket.send(JSON.stringify(response));
					}
					catch(error){
						console.log('error sending message!!');
					}
				}
			}
			else{
				console.log('bad type: '+data.type);
			}
		});

		theSocket.on('close',function(){
			theSocket = undefined;
		});
	}

	else socket.close();
});

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

var theRoland = {

	///////////
	///////////
	///////////

	// static values

	'coord' : {
		'x' : 0,
		'y' : 0
	},

	///////////
	///////////
	///////////

	'updateCoord' : function(axis,amount){
		if(this.coord[axis]!==undefined && !isNaN(amount)){
			this.coord[axis] = Math.floor(amount+this.coord[axis]);
			if(this.coord[axis]<0){
				this.coord[axis] = 0;
			}
		}
	}

	///////////
	///////////
	///////////
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

// controls the current position

var handlers = {

	///////////
	///////////
	///////////

	'scan' : function () {

		// get a list of all available serial ports
		// and then update the browser with that list
		scanPorts(function (portArray) {
			if(theSocket){
				var msg = {
					'type' : 'scan',
					'data' : portArray
				};

				theSocket.send(JSON.stringify(msg));
			}
		});
	},

	///////////
	///////////
	///////////

	'connect' : function (data) {
		portname = data;

		openSerialPort();
	},

	///////////
	///////////
	///////////

	'erase' : function (){
		// just disconnect then connect the serial port
		openSerialPort();
	},

	///////////
	///////////
	///////////

	'jog' : function (data) {

		var axis = data.axis;
		var amount = Number(data.amount);

		if(axis==='x' || axis==='y'){
			theRoland.updateCoord(axis,amount);
		}

		this.sync();
	},

	///////////
	///////////
	///////////

	'sync' : function () {
		var instruction = moveHead(theRoland.coord);

		if(theSocket){

			var msg = {
				'type' : 'sync',
				'data' : theRoland.coord
			};

			theSocket.send(JSON.stringify(msg));
		}

		sendToRoland(instruction);
	},

	///////////
	///////////
	///////////

	'mill' : function(data){

		var minDepth = 1; // minimum depth we will mill
		var minDiameter = 10; // 1/100 inch bit
		// get the lines
		var lines = data.lines;

		var depth = Math.abs(Math.floor(Number(data.depth)));
		if(isNaN(depth) || depth<minDepth) depth = minDepth;

		var diameter = Math.floor(Number(data.diameter));
		if(isNaN(diameter) || diameter<minDiameter) diameter = minDiameter;

		var plungeDepth = Math.round(diameter/5);

		// decide how many times we have go around cutting
		var iterations = Math.floor(depth/plungeDepth);

		// riase the head between line segments if
		// the bit is 1/64 inch or 1/100 inch
		var VS_value = 6;
		var VZ_value = 1.2;
		var RC_value = 12000;

		if (diameter<20) {
			VS_value = 2.4;
			VZ_value = 0.6;
		}

		// go through every full-plungeDepth iteration
		var job_text = 'PA;PA;';
		job_text += 'VS'+VS_value+';';
		job_text += '!VZ'+VZ_value+';';
		job_text += '!RC'+RC_value+';';

		// loop through all lines
		for(var l=0;l<lines.length;l++){

			// we will go through this line for each iteration
			// starting shallow, and going down until we've reached the full depth
			var cuts = lines[l];

			var cutBackwards = false;

			var stepDepth = 0;

			// then loop through the number of iteration we will take
			// if we're only doing one pass, iterations will equal 0
			for(var i=1;i<=iterations;i++){

				// each iteration will go down a step in the plunge depth
				stepDepth = Math.floor(plungeDepth * i);

				// create and save the new line at this depth
				job_text += makeIteration(stepDepth, cuts, cutBackwards);
				cutBackwards = !cutBackwards;
			}

			// now do the one final depth cut, if we need to
			if(stepDepth<depth) {
				job_text += makeIteration(depth, cuts, cutBackwards);
			}
		}

		// stop the spindle, and return to the origin
		job_text += 'PU;!MC0;PU';
		job_text += theRoland.coord.x;
		job_text += ',';
		job_text += theRoland.coord.y;
		job_text += ';!PZ0,200;PD;';

		sendToRoland(job_text);

		///////////
		///////////
		///////////

		function makeIteration(depth, cuts, backwards){

			depth *= -1;
			var text = '!PZ';
			text += depth; // the current depth we will cut at
			text += ',50;!MC1;\r\n';

			var startIndex = backwards ? cuts.length-1 : 0;
			var indexStep = backwards ? -1 : 1;

			if(cuts.length){

				// an array of cut points creates a line
				// so start by flying above the first point in the line
				text += flyTo(cuts[startIndex]);

				// then cut to each point in the array
				for(var c=startIndex;c<cuts.length && c>=0;c+=indexStep){
					text += millTo(cuts[c]);
				}
			}

			return text;
		}

		///////////
		///////////
		///////////

		function millTo (cut) {
			var string = 'PD;PD';
			string += cut.x + theRoland.coord.x;
			string += ',';
			string += cut.y + theRoland.coord.y;
			string += ';\r\n';
			return string;
		}

		///////////
		///////////
		///////////

		function flyTo (cut) {
			var string = 'PU;PU';
			string += cut.x + theRoland.coord.x;
			string += ',';
			string += cut.y + theRoland.coord.y;
			string += ';\r\n';
			return string;
		}

		///////////
		///////////
		///////////
	}

	///////////
	///////////
	///////////
};

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

function moveHead(point){

	var jogText = 'PA;PA;VS10;!VZ10;!PZ0,300;!MC0;';

	// move up
	jogText += 'PU;';
	// then move to the desired spot
	jogText += ('PU'+point.x+','+point.y+';');
	// then move down
	jogText += 'PD;';

	return jogText;
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

function scanPorts(callback) {
	serialport.list(function (error, ports) {
		callback(ports);
	});
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

function sendToRoland(fileText,onSuccess,onError){

	if(myPort) {
		myPort.write(fileText);
	}
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

function openSerialPort (callback) {

	function createIt () {

		if(portname) {
			var options = {
				'flowControl' : true
			};

			myPort = new serialport.SerialPort(portname,options);

			myPort.on('open',function(){
				// tell the browser we've connected
				var msg = {
					'type' : 'connection',
					'data' : true
				};

				theSocket.send(JSON.stringify(msg));

				if(callback) callback();
			});

			myPort.on('close',function(){

				myPort = undefined;

				// tell the browser we've disconnected
				var msg = {
					'type' : 'connection',
					'data' : false
				};

				theSocket.send(JSON.stringify(msg));
			});
		}
		else {
			// no portname has been set!
		}
	}

	if(!myPort) createIt();
	else closeSerialPort(function(){
		setTimeout(function(){
			createIt();
		},1000);
	});
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

function closeSerialPort (callback) {
	if(myPort) {
		myPort.close(function(){

			myPort = undefined;

			// tell the browser we've disconnected
			var msg = {
				'type' : 'connection',
				'data' : false
			};

			theSocket.send(JSON.stringify(msg));

			if(callback) callback();
		});
	}
	else if(callback) callback();
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////