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

		var syncMsg = {
			'type' : 'sync',
			'data' : ''
		};

		ws.send(JSON.stringify(syncMsg));
	};

	ws.onmessage = function(msg){
		var data = JSON.parse(msg.data);
		console.log(data);
	};

	ws.onclose = function(){
		ws.isOpen = false;
		document.body.style.backgroundColor = 'rgb(225,100,100)';
	}
});

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

function throwError(string){
	alert(string);
}

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////