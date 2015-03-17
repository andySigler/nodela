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

		sync();
	};

	ws.onmessage = function(msg){
		msg = JSON.parse(msg.data);
		if (msg.type==='erase') {
			if (msg.data==='success') {
				document.getElementById('eraseBox').style.backgroundColor = 'rgb(30,225,125)';
				document.getElementById('eraseStatus').style.textAlign = 'left';
				var eraseInstructions = 'Erase attempt successful, but the Roland\'s driver doesn\'t always cooperate.<ol><li>In the Start menu, open "Devices and Printers."</li><li>Double click the Roland\'s icon to see the driver\'s queue.</li><li>If jobs are still listed, try erasing again.</li></ol>';
				document.getElementById('eraseStatus').innerHTML = eraseInstructions;
				document.getElementById('printerButton').style.display = 'inline-block';
			}
			else {
				document.getElementById('eraseStatus').innerHTML = msg.data;
			}
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
	tempString += 'Layer:\t'+currentLayerName+'\n';
	tempString += 'Bit:\t\t'+bitName+'\n';
	tempString += 'Depth:\t'+cutDepth+'\n\n';
	tempString += 'Click OK to run';


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

function Roland_eraseMemory(){

	alert("Please Press both up and Down arrows");

	var isBlinking = confirm("Has the light been blinking for more than 5 seconds?");

	if(isBlinking) {

		var msg = {
			'type' : 'erase',
			'data' : {}
		}

		if(ws && ws.isOpen){
			ws.send(JSON.stringify(msg));

			document.getElementById('eraseBox').style.display = 'block';
			document.getElementById('eraseBox').style.backgroundColor = 'rgb(225,30,30)';
			document.getElementById('eraseStatus').style.textAlign = 'center';
			document.getElementById('eraseStatus').innerHTML = 'Waiting for response...';
			document.getElementById('printerButton').style.display = 'none';
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