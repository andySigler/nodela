////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

var ws = undefined;

window.addEventListener('load',function(){
	ws = new WebSocket('ws://'+location.host);

	ws.isOpen = false;

	ws.onopen = function(){
		ws.isOpen = true;
		document.body.style.backgroundColor = 'white';

		//sync();

		scanPorts();
	};

	ws.onmessage = function(msg){
		msg = JSON.parse(msg.data);
		if(msg.type==='scan') {
			var portsMenu = document.getElementById('portsMenu');
			portsMenu.innerHTML = '';
			for(var i=0;i<msg.data.length;i++) {
				var thisOption = document.createElement('option');
				thisOption.innerHTML = msg.data[i].comName;
				portsMenu.appendChild(thisOption);
			}
		}
		else if(msg.type==='connection') {
			if(msg.data===true) isPortConnected = true;
			else isPortConnected = false;

			var portButton = document.getElementById('portButton');

			if(isPortConnected) {
				console.log('one');
				portButton.style.backgroundColor = 'rgb(30,225,125)';
				document.getElementById('print_button').disabled = false;
			}
			else {
				console.log('two');
				portButton.style.backgroundColor = 'rgb(205,205,205)';
				document.getElementById('print_button').disabled = true;
			}
		}
		else {
			console.log(msg);
		}
	};

	ws.onclose = function(){
		ws.isOpen = false;
		document.body.style.backgroundColor = 'rgb(225,100,100)';
	}
});

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

var isPortConnected = false;

function portConnect(){
	var portsMenu = document.getElementById('portsMenu');
	var portname = portsMenu.options[portsMenu.selectedIndex].value;

	var syncMsg = {
		'type' : 'connect',
		'data' : portname
	};

	ws.send(JSON.stringify(syncMsg));
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

function scanPorts() {
	var syncMsg = {
		'type' : 'scan',
		'data' : ''
	};

	ws.send(JSON.stringify(syncMsg));
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

function sync() {
	var syncMsg = {
		'type' : 'sync',
		'data' : ''
	};

	ws.send(JSON.stringify(syncMsg));
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

function Roland_sendJog(axis,amount){

	var msg = {
		'type' : 'jog',
		'data' : {
			'axis' : axis,
			'amount' : amount
		}
	}

	if(ws.isOpen){
		ws.send(JSON.stringify(msg));
	}
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

function Roland_sendCuts(globalLines, currentLayerName){

	var lines = JSON.parse(JSON.stringify(globalLines));


	// if we mirrored the board, undo the X changes I made before in mirror() function
	// these changes were made so to help the visualization
	// this feels sloppy, needs to change, but works for now...
	if(isMirrored) {
		for(var i=0;i<lines.length;i++) {
			for(var n=0;n<lines[i].length;n++) {
				lines[i][n].x -= ((currentBoard.info.min.x * 2) + currentBoard.info.width);
			}
		}
	}

	var bitMenu = document.getElementById('bitDiameter');
	var bitName = bitMenu.options[bitMenu.selectedIndex].innerHTML;

	var cutDepth = Number(document.getElementById('cutDepth').value);

	var tempString = '';
	tempString += '\n\nDouble check your settings:\n\n';
	tempString += 'Layer:\n         -> '+currentLayerName+'\n\n';
	tempString += 'Bit:\n         -> '+bitName+'\n\n';
	tempString += 'Depth:\n         -> '+cutDepth;

	var readyToCut = confirm(tempString);

	if(readyToCut) {
		var bitDiameter = Number(bitMenu.value);
		if(bitDiameter!==NaN && bitDiameter>=0){
			if(cutDepth!==NaN && cutDepth>=0 && cutDepth<0.33){

				bitDiameter = Math.round(bitDiameter*1016);
				cutDepth = Math.round(cutDepth*1016);

				var msg = {
					'type' : 'mill',
					'data' : {
						'diameter' : bitDiameter,
						'depth' : cutDepth,
						'lines' : lines
					}
				}

				if(ws && ws.isOpen){
					ws.send(JSON.stringify(msg));
				}
				else{
					throwError('Browser is not connected to the server');
				}
			}
			else{
				throwError('Bad value for the Cut Depth');
			}
		}
		else{
			throwError('Bad value for the Bit Diameter');
		}
	}
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

function throwError(string){
	alert(string);
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////