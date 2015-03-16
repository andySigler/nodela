//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

var redColor = 'rgb(242,49,28)';
var blueColor = 'rgb(28,129,212)';
var greyColor = 'rgb(205,205,205)';

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

			// as a safety measure, set the cut-depth to the default value
			document.getElementById('cutDepth').value = minCutDepth;

			var cans = parent.children;
			for(var i=0;i<cans.length;i++){
				if(cans[i]===canvas){
					cans[i].classList.remove('grayed');
					parent.visibleLayer = cans[i];
					if(cans[i].parent){
						cans[i].parent.button.style.backgroundColor = isMirrored ? blueColor : redColor;
						cans[i].parent.button.style.color = 'white';
					}
				}
				else{
					cans[i].classList.add('grayed');
					if(cans[i].parent){
						cans[i].parent.button.style.color = 'black';
						cans[i].parent.button.style.backgroundColor = greyColor;
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

			this.context.save();

			var xOffset = Math.floor(brd.info.min.x*-1*_scale);
			var yOffset = Math.floor(brd.info.min.y*_scale);

			this.context.translate(xOffset,yOffset);

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

			this.context.restore();
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
		var thisLayerName = currentBoard.info.layers[n];
		var c = makeCanvas(thisLayerName);
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

			if(wire.x2!==wire.x1 || wire.y1!==wire.y2){
				currentLine.push({
					'x':wire.x2,
					'y':wire.y2
				});
			}

			prev.x = wire.x2;
			prev.y = wire.y2;
		}

		// add the final line we constructed
		c.cuts.push(currentLine);
	}

	// the HOLES canvas layer

	var c;
	var noHoles = true;

	for(var p in brd.parts){
		var thisPart = brd.parts[p];

		if(thisPart.holes){
			for(var i=0;i<thisPart.holes.length;i++){

				if(noHoles) {
					noHoles = false;
					c = makeCanvas('Holes');
					c.canvas.parent = c;
				}

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

	var c;
	var noVias = true;

	for(var v in brd.vias){

		if(noVias) {
			noVias = false;
			c = makeCanvas('Vias');
			c.canvas.parent = c;
		}
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

	isMirrored = false;

	var button = document.getElementById('mirror_button');
	if(isMirrored){
		button.classList.add('bottom_layer');
		button.classList.remove('top_layer');
		parent.classList.add('mirrored_line');
		button.innerHTML = 'MIRRORED';
	}
	else{
		button.classList.remove('bottom_layer');
		button.classList.add('top_layer');
		parent.classList.remove('mirrored_line');
		button.innerHTML = 'NOT MIRRORED';
	}

	var cans = parent.getElementsByTagName('canvas');

	if(cans.length>0){

		//document.getElementById('container').style.display = 'block';
		//document.getElementById('dragWords').style.display = 'none';

		for(var i=0;i<cans.length;i++){
			var layer = cans[i].parent;

			var theWidth = Math.round(layer.width*vizScale);
			var theHeight = Math.round(layer.height*vizScale);

			var strokeSize = Math.min(theWidth,theHeight)*.01;

			var padding = Math.round(theWidth*vizScale*.1);
			theWidth+=(padding*2);
			theHeight+=(padding*2);

			var drawColor = isMirrored ? 'rgb(28,129,212)' : 'rgb(242,69,28)';

			cans[i].parent.button.style.backgroundColor = isMirrored ? blueColor : redColor;
			cans[i].parent.button.style.color = 'white';

			layer.draw(theWidth,theHeight,padding,drawColor,2,vizScale);
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
		button.classList.add('bottom_layer');
		button.classList.remove('top_layer');
		parent.classList.add('mirrored_line');
		button.innerHTML = 'MIRRORED';
	}
	else{
		button.classList.remove('bottom_layer');
		button.classList.add('top_layer');
		parent.classList.remove('mirrored_line');
		button.innerHTML = 'NOT MIRRORED';
	}

	for(var i=0;i<cans.length;i++){
		var can = cans[i];
		var cuts = can.parent.cuts;
		for(var n=0;n<cuts.length;n++){
			var c = cuts[n];
			for(var b=0;b<c.length;b++){
				var coord = c[b];
				coord.x = ((coord.x*-1) + can.parent.width) + (currentBoard.info.min.x * 2);
			}
		}

		var layer = can.parent;

		var theWidth = Math.round(layer.width*vizScale);
		var theHeight = Math.round(layer.height*vizScale);

		var padding = Math.round(theWidth*vizScale*.1);
		theWidth+=(padding*2);
		theHeight+=(padding*2);

		var drawColor = isMirrored ? 'rgb(28,129,212)' : 'rgb(242,69,28)';

		parent.visibleLayer.parent.button.style.backgroundColor = isMirrored ? blueColor : redColor;
		parent.visibleLayer.parent.button.style.color = 'white';

		layer.draw(theWidth,theHeight,padding,drawColor,2,vizScale);

	}

	updateOriginArrow();
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

function printLayer(){
	var parent = document.getElementById('canvas_container');
	if(parent.visibleLayer){
		var cuts = parent.visibleLayer.parent.cuts;
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

	var obj = document.getElementsByTagName('canvas')[0];
	if(obj){

		var originArrow = document.getElementById('originArrow');
		originArrow.style.display = 'block';

		var originCircle = document.getElementById('originCircle');
		originCircle.style.display = 'block';

		var origin_warning = document.getElementById('origin_warning');
		origin_warning.style.display = 'inline-block';

		var boardOffsetX = Math.floor(currentBoard.info.min.x * vizScale);
		var boardOffsetY = Math.floor(currentBoard.info.min.y * vizScale);

		var arrowY = obj.offsetHeight+boardOffsetY;
		var arrowX = (originArrow.parentNode.offsetWidth/2)+(obj.offsetWidth/2)+boardOffsetX;

		if(isMirrored) {
			arrowX = originArrow.parentNode.offsetWidth - arrowX;
		}

		originArrow.style.top = arrowY+'px';
		originArrow.style.right = arrowX+'px';

		originCircle.style.top = arrowY+'px';
		originCircle.style.right = arrowX+'px';

		origin_warning.style.top = arrowY+'px';
		origin_warning.style.right = arrowX+'px';
	}
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

				currentBoard = parseXML(reader.result);

				displayBoard();
			}

			reader.readAsText(_F);
		}
	}
}

//////////////
//////////////
//////////////

var currentBoard = undefined;
var vizScale = 0.12;

function displayBoard() {

	document.getElementById('widthLabel').style.display = 'inline';
	document.getElementById('heightLabel').style.display = 'inline';
	document.getElementById('mirror_button').style.display = 'inline-block';

	parseLayers(currentBoard);
	drawAllLayers();

	updateOriginArrow();

	var kids = document.getElementById('canvas_container').children;
	kids[0].parent.select();
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
	var min={'x':0,'y':0};

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

		var theseLayers = xmlDoc.getElementsByTagName('layers')[0].getElementsByTagName('layer');
		var foundLayers = {};

		for(var l=0;l<theseLayers.length;l++) {
			var layerNumber = theseLayers[l].getAttribute('number');
			var layerName = theseLayers[l].getAttribute('name');
			foundLayers[layerNumber] = layerName;
		}

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
				'height' : max.y-min.y,
				'min' : min,
				'max' : max,
				'layers' : foundLayers
			};

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

function loadFacingPlan() {
	currentBoard = facingPlan_design;
	displayBoard();
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

var facingPlan_design =  {
  "wires": {
    "20": [
      {
        "x1": 508,
        "x2": 6604,
        "y1": 508,
        "y2": 508,
        "layer": 20,
        "width": 0
      },
      {
        "x1": 6604,
        "x2": 6604,
        "y1": 508,
        "y2": 4572,
        "layer": 20,
        "width": 0
      },
      {
        "x1": 6604,
        "x2": 508,
        "y1": 4572,
        "y2": 4572,
        "layer": 20,
        "width": 0
      },
      {
        "x1": 508,
        "x2": 508,
        "y1": 4572,
        "y2": 508,
        "layer": 20,
        "width": 0
      },
      {
        "x1": 1015,
        "x2": 1016,
        "y1": 4572,
        "y2": 4572,
        "layer": 20,
        "width": 0
      }
    ],
    "46": [
      {
        "x1": 0,
        "x2": 7214,
        "y1": 0,
        "y2": 0,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 7214,
        "x2": 7214,
        "y1": 0,
        "y2": 5182,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 7214,
        "x2": 0,
        "y1": 5182,
        "y2": 5182,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 0,
        "x2": 0,
        "y1": 5182,
        "y2": 102,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 0,
        "x2": 7112,
        "y1": 102,
        "y2": 102,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 7112,
        "x2": 7112,
        "y1": 102,
        "y2": 5080,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 7112,
        "x2": 102,
        "y1": 5080,
        "y2": 5080,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 102,
        "x2": 102,
        "y1": 5080,
        "y2": 203,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 102,
        "x2": 7010,
        "y1": 203,
        "y2": 203,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 7010,
        "x2": 7010,
        "y1": 203,
        "y2": 4978,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 7010,
        "x2": 203,
        "y1": 4978,
        "y2": 4978,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 203,
        "x2": 203,
        "y1": 4978,
        "y2": 305,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 203,
        "x2": 6909,
        "y1": 305,
        "y2": 305,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6909,
        "x2": 6909,
        "y1": 305,
        "y2": 4877,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6909,
        "x2": 305,
        "y1": 4877,
        "y2": 4877,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 305,
        "x2": 305,
        "y1": 4877,
        "y2": 406,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 305,
        "x2": 6807,
        "y1": 406,
        "y2": 406,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6807,
        "x2": 6807,
        "y1": 406,
        "y2": 4775,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6807,
        "x2": 406,
        "y1": 4775,
        "y2": 4775,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 406,
        "x2": 406,
        "y1": 4775,
        "y2": 508,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 406,
        "x2": 6706,
        "y1": 508,
        "y2": 508,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6706,
        "x2": 6706,
        "y1": 508,
        "y2": 4674,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6706,
        "x2": 508,
        "y1": 4674,
        "y2": 4674,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 508,
        "x2": 508,
        "y1": 4674,
        "y2": 610,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 508,
        "x2": 6604,
        "y1": 610,
        "y2": 610,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6604,
        "x2": 6604,
        "y1": 610,
        "y2": 4572,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6604,
        "x2": 610,
        "y1": 4572,
        "y2": 4572,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 610,
        "x2": 610,
        "y1": 4572,
        "y2": 711,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 610,
        "x2": 6502,
        "y1": 711,
        "y2": 711,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6502,
        "x2": 6502,
        "y1": 711,
        "y2": 4470,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6502,
        "x2": 711,
        "y1": 4470,
        "y2": 4470,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 711,
        "x2": 711,
        "y1": 4470,
        "y2": 813,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 711,
        "x2": 6401,
        "y1": 813,
        "y2": 813,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6401,
        "x2": 6401,
        "y1": 813,
        "y2": 4369,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6401,
        "x2": 813,
        "y1": 4369,
        "y2": 4369,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 813,
        "x2": 813,
        "y1": 4369,
        "y2": 914,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 813,
        "x2": 6299,
        "y1": 914,
        "y2": 914,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6299,
        "x2": 6299,
        "y1": 914,
        "y2": 4267,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6299,
        "x2": 914,
        "y1": 4267,
        "y2": 4267,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 914,
        "x2": 914,
        "y1": 4267,
        "y2": 1016,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 914,
        "x2": 6198,
        "y1": 1016,
        "y2": 1016,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6198,
        "x2": 6198,
        "y1": 1016,
        "y2": 4166,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6198,
        "x2": 1016,
        "y1": 4166,
        "y2": 4166,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1016,
        "x2": 1016,
        "y1": 4166,
        "y2": 1118,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1016,
        "x2": 6096,
        "y1": 1118,
        "y2": 1118,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6096,
        "x2": 6096,
        "y1": 1118,
        "y2": 4064,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 6096,
        "x2": 1118,
        "y1": 4064,
        "y2": 4064,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1118,
        "x2": 1118,
        "y1": 4064,
        "y2": 1219,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1118,
        "x2": 5994,
        "y1": 1219,
        "y2": 1219,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5994,
        "x2": 5994,
        "y1": 1219,
        "y2": 3962,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5994,
        "x2": 1219,
        "y1": 3962,
        "y2": 3962,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1219,
        "x2": 1219,
        "y1": 3962,
        "y2": 1321,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1219,
        "x2": 5893,
        "y1": 1321,
        "y2": 1321,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5893,
        "x2": 5893,
        "y1": 1321,
        "y2": 3861,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5893,
        "x2": 1321,
        "y1": 3861,
        "y2": 3861,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1321,
        "x2": 1321,
        "y1": 3861,
        "y2": 1422,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1321,
        "x2": 5791,
        "y1": 1422,
        "y2": 1422,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5791,
        "x2": 5791,
        "y1": 1422,
        "y2": 3759,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5791,
        "x2": 1422,
        "y1": 3759,
        "y2": 3759,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1422,
        "x2": 1422,
        "y1": 3759,
        "y2": 1524,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1422,
        "x2": 5690,
        "y1": 1524,
        "y2": 1524,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5690,
        "x2": 5690,
        "y1": 1524,
        "y2": 3658,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5690,
        "x2": 1524,
        "y1": 3658,
        "y2": 3658,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1524,
        "x2": 1524,
        "y1": 3658,
        "y2": 1626,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1524,
        "x2": 5588,
        "y1": 1626,
        "y2": 1626,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5588,
        "x2": 5588,
        "y1": 1626,
        "y2": 3556,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5588,
        "x2": 1626,
        "y1": 3556,
        "y2": 3556,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1626,
        "x2": 1626,
        "y1": 3556,
        "y2": 1727,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1626,
        "x2": 5486,
        "y1": 1727,
        "y2": 1727,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5486,
        "x2": 5486,
        "y1": 1727,
        "y2": 3454,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5486,
        "x2": 1727,
        "y1": 3454,
        "y2": 3454,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1727,
        "x2": 1727,
        "y1": 3454,
        "y2": 1829,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1727,
        "x2": 5385,
        "y1": 1829,
        "y2": 1829,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5385,
        "x2": 5385,
        "y1": 1829,
        "y2": 3353,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5385,
        "x2": 1829,
        "y1": 3353,
        "y2": 3353,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1829,
        "x2": 1829,
        "y1": 3353,
        "y2": 1930,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1829,
        "x2": 5283,
        "y1": 1930,
        "y2": 1930,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5283,
        "x2": 5283,
        "y1": 1930,
        "y2": 3251,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5283,
        "x2": 1930,
        "y1": 3251,
        "y2": 3251,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1930,
        "x2": 1930,
        "y1": 3251,
        "y2": 2032,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 1930,
        "x2": 5182,
        "y1": 2032,
        "y2": 2032,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5182,
        "x2": 5182,
        "y1": 2032,
        "y2": 3150,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5182,
        "x2": 2032,
        "y1": 3150,
        "y2": 3150,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2032,
        "x2": 2032,
        "y1": 3150,
        "y2": 2134,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2032,
        "x2": 5080,
        "y1": 2134,
        "y2": 2134,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5080,
        "x2": 5080,
        "y1": 2134,
        "y2": 3048,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 5080,
        "x2": 2134,
        "y1": 3048,
        "y2": 3048,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2134,
        "x2": 2134,
        "y1": 3048,
        "y2": 2235,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2134,
        "x2": 4978,
        "y1": 2235,
        "y2": 2235,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4978,
        "x2": 4978,
        "y1": 2235,
        "y2": 2946,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4978,
        "x2": 2235,
        "y1": 2946,
        "y2": 2946,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2235,
        "x2": 2235,
        "y1": 2946,
        "y2": 2337,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2235,
        "x2": 4877,
        "y1": 2337,
        "y2": 2337,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4877,
        "x2": 4877,
        "y1": 2337,
        "y2": 2845,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4877,
        "x2": 2337,
        "y1": 2845,
        "y2": 2845,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2337,
        "x2": 2337,
        "y1": 2845,
        "y2": 2438,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2337,
        "x2": 4775,
        "y1": 2438,
        "y2": 2438,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4775,
        "x2": 4775,
        "y1": 2438,
        "y2": 2743,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4775,
        "x2": 2438,
        "y1": 2743,
        "y2": 2743,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2438,
        "x2": 2438,
        "y1": 2743,
        "y2": 2540,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 2438,
        "x2": 4674,
        "y1": 2540,
        "y2": 2540,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4674,
        "x2": 4674,
        "y1": 2540,
        "y2": 2642,
        "layer": 46,
        "width": 3.175
      },
      {
        "x1": 4674,
        "x2": 2540,
        "y1": 2642,
        "y2": 2642,
        "layer": 46,
        "width": 3.175
      }
    ]
  },
  "parts": {},
  "vias": [
    {
      "x": 386,
      "y": 1016
    },
    {
      "x": 386,
      "y": 1524
    },
    {
      "x": 386,
      "y": 2032
    },
    {
      "x": 386,
      "y": 2540
    },
    {
      "x": 386,
      "y": 3048
    },
    {
      "x": 386,
      "y": 3556
    },
    {
      "x": 386,
      "y": 4064
    },
    {
      "x": 6726,
      "y": 1016
    },
    {
      "x": 6726,
      "y": 1524
    },
    {
      "x": 6726,
      "y": 2032
    },
    {
      "x": 6726,
      "y": 2540
    },
    {
      "x": 6726,
      "y": 3048
    },
    {
      "x": 6726,
      "y": 3556
    },
    {
      "x": 6726,
      "y": 4064
    },
    {
      "x": 1016,
      "y": 4694
    },
    {
      "x": 1524,
      "y": 4694
    },
    {
      "x": 2032,
      "y": 4694
    },
    {
      "x": 2540,
      "y": 4694
    },
    {
      "x": 3048,
      "y": 4694
    },
    {
      "x": 3556,
      "y": 4694
    },
    {
      "x": 4064,
      "y": 4694
    },
    {
      "x": 4572,
      "y": 4694
    },
    {
      "x": 5080,
      "y": 4694
    },
    {
      "x": 5588,
      "y": 4694
    },
    {
      "x": 6096,
      "y": 4694
    },
    {
      "x": 6096,
      "y": 386
    },
    {
      "x": 5588,
      "y": 386
    },
    {
      "x": 5080,
      "y": 386
    },
    {
      "x": 4572,
      "y": 386
    },
    {
      "x": 4064,
      "y": 386
    },
    {
      "x": 3556,
      "y": 386
    },
    {
      "x": 3048,
      "y": 386
    },
    {
      "x": 2540,
      "y": 386
    },
    {
      "x": 2032,
      "y": 386
    },
    {
      "x": 1524,
      "y": 386
    },
    {
      "x": 1016,
      "y": 386
    }
  ],
  "info": {
    "width": 7214,
    "height": 5182,
    "min" : {
    	"x" : 0,
    	"y" : 0
    },
    "max" : {
    	"x" : 7214,
    	"y" : 5182
    },
    'layers' : {
    	20 : '4 x 6 Marker',
    	46 : 'Face (1/8" bit)'
    }
  }
};

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////