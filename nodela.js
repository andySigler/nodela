
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

var sys = require('sys')
var process = require('child_process');

var _test = false;
var _windows = true;

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

var execTemp = process.exec;
var tempCommand = _windows ? 'start' : 'open';
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

	'erase' : function(){
		if(_test){
			setTimeout(function(){
				if(theSocket){

					var msg = {
						'type' : 'erase',
						'data' : 'success'
					};

					theSocket.send(JSON.stringify(msg));
				}
			},2000);
		}
		else{
			eraseRoland();
		}
	},

	///////////
	///////////
	///////////

	'jog' : function(data){

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

	'sync' : function(){
		var instruction = moveHead(theRoland.coord);

		if(theSocket){

			var msg = {
				'type' : 'sync',
				'data' : theRoland.coord
			};

			theSocket.send(JSON.stringify(msg));
		}

		if(!_test) sendToRoland(instruction);
	},

	///////////
	///////////
	///////////

	'mill' : function(data){
		// get the lines
		var lines = data.lines;

		var depth = Math.abs(Math.floor(Number(data.depth)));
		if(!depth || depth<3) depth = 3; // minimum cut depth

		var diameter = Math.floor(Number(data.diameter));
		if(!diameter || diameter<16) depth = 16; // minimum bit diameter

		var radius = Math.round(diameter/2);

		// decide how many times we have go around cutting
		var iterations = Math.floor(depth/radius);
		var roloverDepth = depth % radius;

		// go through ever full-radius-depth iteration
		var job_text = 'PA;PA;VS2;';
		for(var i=1;i<=iterations;i++){
			var stepDepth = Math.floor(radius * i);
			job_text += makeIteration(stepDepth);
		}

		// now do the one rollover depth (always happens)
		var finalDepth = (iterations*radius)+roloverDepth;
		job_text += makeIteration(finalDepth);

		job_text += 'PU;!MC0;PU';
		job_text += theRoland.coord.x;
		job_text += ',';
		job_text += theRoland.coord.y;
		job_text += ';!PZ0,200;PD;';

		sendToRoland(job_text);

		///////////
		///////////
		///////////

		function makeIteration(depth){
			depth *= -1;
			var text = '!PZ';
			text += depth;
			text += ',50;!MC1;';

			for(var l=0;l<lines.length;l++){
				var cuts = lines[l];
				if(cuts.length>0){
					text += 'PU;PU';
					text += cuts[0].x + theRoland.coord.x;
					text += ','
					text += cuts[0].y + theRoland.coord.y;
					text += ';\r\n';
					for(var c=0;c<cuts.length;c++){
						text += 'PD';
						text += cuts[c].x + theRoland.coord.x;
						text += ',';
						text += cuts[c].y + theRoland.coord.y;
						text += ';\r\n';
					}
				}
			}

			return text;
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

	var jogText = 'PA;PA;VS3;!PZ0,300;!MC0;';

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

function sendToRoland(fileText,onSuccess,onError){

	var fileName = 'move.mill'; // the temp file we create

	// create the temporary file in this directory
	fs.writeFile(fileName,fileText,function(error){
		if(error){
			console.log('\t\tError saving the file:\r\r');
			console.log(error);
			if(onError) onError();
		}
		else{

			var commandLine = 'type '+fileName+' > com3';
			if(_test){
				if(_windows) commandLine = 'type '+fileName; // view it before erasing
				else commandLine = 'cat '+fileName;
			}

			exec(commandLine, function (error, stdout, stderr) {
				if(error){
					console.log('\t\tError sending the command "'+commandLine+'":\r\r');
					console.log(error);
					if(onError) onError();
				}
				if(stdout){
					if(_test){
						console.log('\r\n');
						console.log(stdout+'\r\r');
					}
					// on completion, erase the temporary file
					fs.unlink(fileName,function(){
						// i dunno, yay?
						if(onSuccess) onSuccess();
					});
				}
			});
		}
	});
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

function eraseRoland(){

	////////////////////////////////////////////
	////////////////////////////////////////////
	////////////////////////////////////////////

	function fireCommand(cmd,onSuccess,onError){

		var exec = process.exec;

		exec(cmd,function(error,stdin,stdout){
			if(error){
				if(onError){
					onError(error);
				}
				else{
					console.log('Error running command: '+cmd);
					console.log(error);
				}
			}
			else{
				if(onSuccess) onSuccess(stdin,stdout);
			}
		});
	}

	function eraseResponse(response){
		if(theSocket){

			var msg = {
				'type' : 'erase',
				'data' : response
			};

			theSocket.send(JSON.stringify(msg));
		}
		else{
			console.log(response);
		}
	}

	////////////////////////////////////////////
	////////////////////////////////////////////
	////////////////////////////////////////////

	var firstCommand = 'net stop spooler';
	eraseResponse('(1/4) stopping the spooler');

	fireCommand(firstCommand,function(){

		var secondCommand = 'del C:\\windows\\System32\\spool\\PRINTERS\\*.SPL';
		eraseResponse('(2/4) erasing .SPL files');

		fireCommand(secondCommand,function(){

			var thirdCommand = 'del C:\\windows\\System32\\spool\\PRINTERS\\*.SHD';
			eraseResponse('(3/4) erasing .SHD files');

			fireCommand(thirdCommand,function(){

				var finalCommand = 'net start spooler';
				eraseResponse('(4/4) starting the spooler');

				fireCommand(finalCommand,function(){

					eraseResponse('success');
				},function(){eraseResponse('(4/4) failed starting spooler');});
			},function(){eraseResponse('(3/4) failed erasing .SHD files');});
		},function(){eraseResponse('(2/4) failed erasing .SPL files');});
	},function(){eraseResponse('(1/4) failed stopping spooler');});
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////