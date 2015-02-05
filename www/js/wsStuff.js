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

function Roland_sendCuts(lines){

	var bitDiameter = Number(document.getElementById('bitDiameter').value);
	if(bitDiameter!==NaN && bitDiameter>=0 && bitDiameter<0.5){
		var cutDepth = Number(document.getElementById('cutDepth').value);
		if(cutDepth!==NaN && cutDepth>=0 && cutDepth<0.33){

			bitDiameter = Math.round(bitDiameter*1016);
			cutDepth = Math.round(cutDepth*1016);

			console.log(lines);

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

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

function Roland_eraseMemory(){
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

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

function throwError(string){
	alert(string);
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////