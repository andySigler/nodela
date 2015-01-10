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
				document.getElementById('eraseStatus').innerHTML = 'Sucess!';
				setTimeout(function(){
					document.getElementById('eraseBox').style.display = 'none';
				},1000);
			}
			else {
				document.getElementById('eraseStatus').innerHTML = msg.data;
			}
		}
		else if (msg.type==='sync') {
			updateXY(msg.data);
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

var rolandWidth = 8.625 * 1016;
var rolandHeight = 6.25 * 1016;

function updateXY (data) {
	var xRel = data.x / rolandWidth;
	var yRel = 1 - (data.y / rolandHeight);

	document.getElementById('xBar').style.left = ((xRel * 100).toFixed(2))+'%';
	document.getElementById('yBar').style.top = ((yRel * 100).toFixed(2))+'%';
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
		document.getElementById('eraseStatus').innerHTML = 'Waiting for response...';
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