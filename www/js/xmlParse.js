//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

function parseLayers(brd){

	var parent = document.getElementById('canvas_container');
	parent.innerHTML = '';
	document.getElementById('layerButtons_div').innerHTML = '';

	////////////
	////////////
	////////////

	function makeCanvas(name){
		var canvas = document.createElement('canvas');
		parent.appendChild(canvas);

		var context = canvas.getContext('2d');

		////////////

		function select(){
			var cans = parent.children;
			for(var i=0;i<cans.length;i++){
				if(cans[i]===canvas){
					cans[i].classList.remove('grayed');
					parent.visibleLayer = cans[i];
					if(cans[i].parent){
						cans[i].parent.button.classList.add('button_selected');
					}
				}
				else{
					cans[i].classList.add('grayed');
					if(cans[i].parent){
						cans[i].parent.button.classList.remove('button_selected');
					}
				}
			}
		}

		var showButton = document.createElement('button');
		showButton.classList.add('layerButton');
		showButton.innerHTML = name;

		document.getElementById('layerButtons_div').appendChild(showButton);

		showButton.addEventListener('click',select);

		////////////

		function rc(){
			return Math.floor(Math.random()*255);
		}

		////////////

		var drawLayer = function(_w,_h,_pad,_color,_strokeSize,_scale){

			this.canvas.width = Math.round(_w);
			this.canvas.height = Math.round(_h);
			this.canvas.style.width = Math.round(_w);+'px';
			this.canvas.style.height = Math.round(_h)+'px';

			this.context.strokeStyle = _color;
			this.context.fillStyle = _color;
			this.context.lineWidth = _strokeSize;

			this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

			for(var i=0;i<this.cuts.length;i++){
				if(this.cuts[i].length>1){
					var prev = {
						'x':this.cuts[i][0].x,
						'y':this.cuts[i][0].y
					};
					for(var m=1;m<this.cuts[i].length;m++) {
						var startX = prev.x;
						var startY = prev.y;
						var endX = this.cuts[i][m].x;
						var endY = this.cuts[i][m].y;

						prev.x = endX;
						prev.y = endY;

						this.context.beginPath();
						this.context.moveTo((startX*_scale)+_pad,_h-((startY*_scale)+_pad));
						this.context.lineTo((endX*_scale)+_pad,_h-((endY*_scale)+_pad));
						this.context.stroke();
					}
				}
				else if(this.cuts[i].length){
					var tempX = this.cuts[i][0].x;
					var tempY = this.cuts[i][0].y;

					this.context.beginPath();
					this.context.arc((tempX*_scale)+_pad,_h-((tempY*_scale)+_pad),4,0,2*Math.PI,false);
					this.context.fill();
				}
			}
		};

		////////////

		return {
			'canvas':canvas,
			'context':context,
			'width':brd.info.width,
			'height':brd.info.height,
			'cuts':[],
			'draw':drawLayer,
			'select':select,
			'button':showButton
		};
	}

	////////////
	////////////
	////////////

	// the WIRES canvas layer

	for(var n in brd.wires){
		var layerWires = brd.wires[n];
		var c = makeCanvas('Layer '+n);
		c.canvas.parent = c;

		var currentLine = [];
		var prev = {'x':NaN,'y':NaN};

		for(var i=0;i<layerWires.length;i++){

			var wire = layerWires[i];

			// if it has a different starting point as the previous wire's ending point,
			// then that means it's a new 'cut' array
			if(i===0) {
				currentLine.push({
					'x':wire.x1,
					'y':wire.y1
				});
			}
			else if (prev.x!==wire.x1 || prev.y!==wire.y1) {
				c.cuts.push(currentLine);
				currentLine = [];
				currentLine.push({
					'x':wire.x1,
					'y':wire.y1
				});
			}

			currentLine.push({
				'x':wire.x2,
				'y':wire.y2
			});

			prev.x = wire.x2;
			prev.t = wire.y2;
		}

		// add the final line we constructed
		c.cuts.push(currentLine);
	}

	// the HOLES canvas layer

	var c = makeCanvas('Holes');
	c.canvas.parent = c;

	for(var p in brd.parts){
		var thisPart = brd.parts[p];

		if(thisPart.holes){
			for(var i=0;i<thisPart.holes.length;i++){
				var thisHole = thisPart.holes[i];

				var thisCut = [];
				thisCut.push({
					'x':thisHole.currentRelX + thisPart.x,
					'y':thisHole.currentRelY + thisPart.y
				});

				c.cuts.push(thisCut);
			}
		}
	}

	// the VIAS canvas layer

	var c = makeCanvas('Vias');
	c.canvas.parent = c;

	for(var v in brd.vias){
		var thisVia = brd.vias[v];

		var thisCut = [];
		thisCut.push({
			'x':thisVia.x,
			'y':thisVia.y
		});
		c.cuts.push(thisCut);
	}
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

function drawAllLayers(){

	var parent = document.getElementById('canvas_container');

	var cans = parent.getElementsByTagName('canvas');

	if(cans.length>0){

		document.getElementById('container').style.display = 'block';
		document.getElementById('dragWords').style.display = 'none';

		for(var i=0;i<cans.length;i++){
			var layer = cans[i].parent;

			var vizScale = 0.12;

			var theWidth = Math.round(layer.width*vizScale);
			var theHeight = Math.round(layer.height*vizScale);

			var strokeSize = Math.min(theWidth,theHeight)*.01;

			var padding = Math.round(theWidth*vizScale*.1);
			theWidth+=(padding*2);
			theHeight+=(padding*2);

			layer.draw(theWidth,theHeight,padding,'rgb(28,129,212)',2,vizScale);
		}

		parent.style.width = theWidth+'px';
		parent.style.height = theHeight+'px';

		var inchesWidth = (layer.width/1016).toFixed(2);
		var inchesHeight = (layer.height/1016).toFixed(2);

		var cmWidth = (inchesWidth*2.54).toFixed(2);
		var cmHeight = (inchesHeight*2.54).toFixed(2);

		var widthString = inchesWidth+' in ('+cmWidth+' cm)';
		var heightString = inchesHeight+' in ('+cmHeight+' cm)';

		document.getElementById('widthLabel').innerHTML = widthString;
		document.getElementById('heightLabel').innerHTML = heightString;
	}
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

var isMirrored = false;

function mirror(){
	var parent = document.getElementById('canvas_container');
	var cans = parent.getElementsByTagName('canvas');

	isMirrored = !isMirrored;

	var button = document.getElementById('mirror_button');
	if(isMirrored){
		button.classList.add('mirrored');
		parent.classList.add('mirrored_line');
		button.innerHTML = 'MIRRORED';
	}
	else{
		button.classList.remove('mirrored');
		parent.classList.remove('mirrored_line');
		button.innerHTML = 'MIRROR';
	}

	for(var i=0;i<cans.length;i++){
		var can = cans[i];
		var cuts = can.parent.cuts;
		for(var n=0;n<cuts.length;n++){
			var c = cuts[n];
			for(var b=0;b<c.length;b++){
				var coord = c[b];
				coord.x = (coord.x*-1)+can.parent.width;
			}
		}
		var vizScale = 0.12;

		var layer = can.parent;

		var theWidth = Math.round(layer.width*vizScale);
		var theHeight = Math.round(layer.height*vizScale);

		var padding = Math.round(theWidth*vizScale*.1);
		theWidth+=(padding*2);
		theHeight+=(padding*2);

		layer.draw(theWidth,theHeight,padding,'rgb(28,129,212)',2,vizScale);

	}
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

function printLayer(){
	var parent = document.getElementById('canvas_container');
	if(parent.visibleLayer){
		var cuts = parent.visibleLayer.parent.cuts;
		console.log(cuts);
		Roland_sendCuts(cuts);
	}
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

window.addEventListener('load',function(){

	window.addEventListener('dragover', function(e){
		e.preventDefault();
	}, false);

	window.addEventListener('dragenter', function(e){
		e.preventDefault();
	}, false);
	window.addEventListener('dragleave', function(e){
		e.preventDefault();
	}, false);

	window.addEventListener('drop', loadFile, false);

	window.addEventListener('resize',function(){
		if(document.getElementById('canvas_container').children.length>0){
			updateOriginArrow();
		}
	});

});

//////////////
//////////////
//////////////

function updateOriginArrow(){
	var originArrow = document.getElementById('originArrow');
	originArrow.style.display = 'block';

	var originCircle = document.getElementById('originCircle');
	originCircle.style.display = 'block';

	var origin_warning = document.getElementById('origin_warning');
	origin_warning.style.display = 'inline-block';

	var obj = document.getElementsByTagName('canvas')[0];
	var y = obj.offsetHeight;
	var x = (originArrow.parentNode.offsetWidth/2)+(obj.offsetWidth/2);

	originArrow.style.top = y+'px';
	originArrow.style.right = x+'px';

	originCircle.style.top = y+'px';
	originCircle.style.right = x+'px';

	origin_warning.style.left = 0+'px';
}

//////////////
//////////////
//////////////

function loadFile(e){
	e.preventDefault();
	var files = e.dataTransfer.files; // FileList object.

	isMirrored = false;

	if(files.length>0){
		for(var i=0;i<files.length;i++){
			var _F = files[i];

			var reader = new FileReader();

			reader.onload = function(e){

				var tempBoard = parseXML(reader.result);
				parseLayers(tempBoard);
				drawAllLayers();

				updateOriginArrow();

				var kids = document.getElementById('canvas_container').children;
				kids[0].parent.select();
			}

			reader.readAsText(_F);
		}
	}
}

//////////////
//////////////
//////////////

function parseXML(theText){

	// parse the wire elements in an object
	function parseWires(allWires){
		var myWires = {};
		for(var i=0;i<allWires.length;i++){
			var tempWire = allWires[i];
			var tempLayer = Number(tempWire.getAttribute('layer'));

			if(!myWires[tempLayer]){
				myWires[tempLayer] = [];
			}

			var _w = {
				'x1' : makeMill(Number(tempWire.getAttribute('x1'))),
				'x2' : makeMill(Number(tempWire.getAttribute('x2'))),
				'y1' : makeMill(Number(tempWire.getAttribute('y1'))),
				'y2' : makeMill(Number(tempWire.getAttribute('y2'))),
				'layer' : Number(tempWire.getAttribute('layer')),
				'width' : Number(tempWire.getAttribute('width'))
			};

			saveMinMax(_w.x1,_w.y1);
			saveMinMax(_w.x2,_w.y2);

			myWires[tempLayer].push(_w);
		}
		return myWires;
	}

	function parseParts(allElements){
		var myParts = {};
		for(var i=0;i<allElements.length;i++){
			var element = allElements[i];
			var tempPart = {
				'name' : element.getAttribute('name'),
				'library' : element.getAttribute('library'),
				'package' : element.getAttribute('package'),
				'rot' : element.getAttribute('rot') || 0,
				'x' : makeMill(Number(element.getAttribute('x'))),
				'y' : makeMill(Number(element.getAttribute('y')))
			};

			saveMinMax(tempPart.x,tempPart.y);

			if(typeof tempPart.rot==='string') tempPart.rot = Number(tempPart.rot.slice(1));

			myParts[tempPart.name] = tempPart;
		}
		return myParts;
	}

	function parseVias(allSignals){
		var myVias = [];
		for(var i=0;i<allSignals.length;i++){
			var signalVias = allSignals[i].getElementsByTagName('via');
			for(var v=0;v<signalVias.length;v++){
				var thisVia = signalVias[v];
				var tempVia = {
					'x' : makeMill(Number(thisVia.getAttribute('x'))),
					'y' : makeMill(Number(thisVia.getAttribute('y')))
				};

				saveMinMax(tempVia.x,tempVia.y);

				myVias.push(tempVia);
			}
		}
		return myVias;
	}

	function addHoles(allLibraries,parts){
		for(var i=0;i<allLibraries.length;i++){

			// isolate the library to get its packages
			var libraryName = allLibraries[i].getAttribute('name');
			var allPackages = allLibraries[i].getElementsByTagName('package');

			for(var p=0;p<allPackages.length;p++){
				var thisPackage = allPackages[p];
				// get all holes from this package
				var allHoles = thisPackage.getElementsByTagName('pad');
				var packName = thisPackage.getAttribute('name');

				// find x, y, and rotation from the library and package name

				for(var n in parts){
					if(parts[n].library===libraryName && parts[n].package===packName){

						var thisPart = parts[n];

						var rads = ((360-thisPart.rot)/180)*Math.PI;
						thisPart.rads = rads;

						thisPart.holes = [];

						// append each hols to this part's hole list
						for(var h=0;h<allHoles.length;h++){
							var thisHole = allHoles[h];

							var relX = Number(thisHole.getAttribute('x'));
							var relY = Number(thisHole.getAttribute('y'));

							var tempHole = {
								'relX' : makeMill(relX),
								'relY' : makeMill(relY),
								'currentRelX' : makeMill((relY*Math.sin(rads))+(relX*Math.cos(rads))),
								'currentRelY' : makeMill((relY*Math.cos(rads))-(relX*Math.sin(rads)))
							};

							thisPart.holes.push(tempHole);
						}
					}
				}
			}
		}

		return parts;
	}

	var max={'x':-9999999,'y':-9999999};
	var min={'x':9999999,'y':9999999};

	function saveMinMax(x,y){
		if(x<min.x) min.x = x;
		if(x>max.x) max.x = x;
		if(y<min.y) min.y = y;
		if(y>max.y) max.y = y;
	}

	var counter = 0;

	function makeMill(num){

		return Math.round(num*millMultiplier);
		//return num;
	}

	var millMultiplier = 1;

	function setUnit(unit){

		var RMLsPerInch = 1016;
		var millimetersPerInch = 25.4;
		var milsPerInch = 1000;

		// if(unit==='inch'){
		// 	millMultiplier = RMLsPerInch;
		// }
		// else if(unit==='mm'){
		 	millMultiplier = RMLsPerInch/millimetersPerInch;
		// }
		// else if(unit==='mil'){
		// 	millMultiplier = RMLsPerInch/milsPerInch;
		// }
	}

	// start the parsing
	if (window.DOMParser){

		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(theText,"text/xml");

		var theLayers = xmlDoc.getElementsByTagName('layers')[0]; // info about the layers

		var theGrid = xmlDoc.getElementsByTagName('grid')[0]; // holds the unit used
		setUnit(theGrid.getAttribute('unit'));

		var theBoard = xmlDoc.getElementsByTagName('board')[0]; // has everything we'll draw

		if(theBoard){

			// 'plain' holds toolpath wires
			var plain = theBoard.getElementsByTagName('plain')[0];
			var allWires = plain.getElementsByTagName('wire');

			// 'elements' holds a part's name, package, x, y, and rotation
			var elements = theBoard.getElementsByTagName('elements')[0];
			var allElements = elements.getElementsByTagName('element')

			// 'signals' holds a signal-line's containing wires, vias, and pads
			var signals = theBoard.getElementsByTagName('signals')[0];
			var allSignals = signals.getElementsByTagName('signal');

			var libraries = theBoard.getElementsByTagName('libraries')[0];
			var allLibraries = libraries.getElementsByTagName('library');


			// create our parts
			var myBoard = {
				'wires' : parseWires(allWires),
				'parts' : addHoles( allLibraries, parseParts(allElements) ),
				'vias' : parseVias(allSignals)
			};

			myBoard.info = {
				'width' : max.x-min.x,
				'height' : max.y-min.y
			};

			var parts = myBoard.parts;
			for(var n in parts){
				parts[n].x -= min.x;
				parts[n].y -= min.y;
			}
			var vias = myBoard.vias;
			for(var n=0;n<vias.length;n++){
				vias[n].x -= min.x;
				vias[n].y -= min.y;
			}
			var wires = myBoard.wires;
			for(var n in wires){
				var thisLayer = wires[n];
				for(var w in thisLayer){
					thisLayer[w].x1 -= min.x;
					thisLayer[w].y1 -= min.y;
					thisLayer[w].x2 -= min.x;
					thisLayer[w].y2 -= min.y;
				}
			}

			return myBoard;
		}
	}
	else{
		console.log('woops, bad browser');
	}
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////