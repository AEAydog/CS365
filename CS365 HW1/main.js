var gl;
var points;

//Webgl variables
var program;

var vBuffer;
var cBuffer;
var vPosition;
var vColor;

//vertex variables
var zoom;
var offset;

var index = 0;
var maxNumVertices = 100;

var p1, p2, p3, p4;
var p = [];


//Functionality modes
var currentFunction = -1;
const functions = {
	square:0,
	triangle:1,
	polygon:2,
	moveObject:3,
	moveCamera:4,
	rotateObject:5,
	selectObject:6,
	selectMultipleObjects:7,
	equitri:8
}

//Event Variables & Arrays
var undoStack = [];
var redoStack = [];

const events = {
	Create: 0,
	Delete: 1,
	Rotate: 2,
	Move: 3
}

var exampleEvent = {
	objId: 0,
	ev: events.Create,
	info: "miscallenous extra info if needed"
};

//Colors
var curColorIndex = -1;
var colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),   // cyan
	vec4( 1.0, 1.0, 1.0, 1.0 )   // White
];

//Object variables & Arrays
var curID = 0;

var selectedObjectId = -1;
var selectedObjects = [];
var copiedObjects = [];


var objects = [];

var exampleObject = {
	id: 0,
	vertices: 
	[
        vec2( -0.2, -0.5 ),
        vec2(  0,  0.5 ),
        vec2(  1, -0.8 )
	],
	
	color: 
	[
        vec4( 0,0,0,0 ),
        vec4( 0,0,0,0 ),
        vec4( 0,0,0,0 )
	],
	vindex: 0,
	size: 0
	//coords: [[x1,y1],[x2,y2],[x3,y3]]
	//.
	//.
	//.
};

window.onload = function init(){
    var canvas = document.getElementById( "gl-canvas" );
     gl = WebGLUtils.setupWebGL( canvas );    
     if ( !gl ) { alert( "WebGL isn't available" ); }        
	//  Configure WebGL
	//
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.4, 0.4, 0.4, 1.0 );
	 
	//  Load shaders and initialize attribute buffers

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );        

	// Load the data into the GPU

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, 80*maxNumVertices, gl.STATIC_DRAW );	
	// Associate out shader variables with our data buffer
	vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition ); 	  
    
    
	cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 160*maxNumVertices, gl.STATIC_DRAW );
    
    vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
	
	//Initialize shader variables
	var zoomLoc = gl.getUniformLocation(program, "zoom");	
	zoom = 1;
	gl.uniform1f(zoomLoc,zoom);
	var offsetLoc = gl.getUniformLocation(program, "offset");
	offset = vec2(0.0,0.0);
	gl.uniform2fv(offsetLoc,offset);	 
	
	//Initialize shape selector
	p1 = vec2(0.0,0.0);
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(p1));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(p1));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+2), flatten(p1));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+3), flatten(p1));
	
	var grayColor = vec4(0.8,0.8,0.8,1.0);
	
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(grayColor));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 1), flatten(grayColor));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 2), flatten(grayColor));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 3), flatten(grayColor));
	
	index += 4;
	
	//--UI FUNCTIONALITIES-- 
	 
	//UI Event Listeners
	var shapeMenu = document.getElementById( "shape-menu" );
	var colorMenu = document.getElementById( "color-menu" );
	var saveButton = document.getElementById( "save-button" );
	var loadButton = document.getElementById( "load-button" );
	
	shapeMenu.addEventListener("click", function(){
		switch(shapeMenu.selectedIndex){
			case(0):
				currentFunction = functions.square;
			break;
			case(1):
				currentFunction = functions.triangle;
			break;
			case(2):
				currentFunction = functions.equitri;
			break;
			case(3):
				currentFunction = functions.polygon;
			break;
			
		}
		
	});
	
	colorMenu.addEventListener("click", function(){
		curColorIndex = colorMenu.selectedIndex;
	});
	
	saveButton.addEventListener("click", function(){
		var filename = "save.txt";
		var data = objects.length + "$";
		data = data + curID + "$";
		data = data + index + "$";
		for(var i = 0; i < objects.length; i++){
			data = data + objects[i].id + "$";
			data = data + objects[i].vertices + "$";
			data = data + objects[i].colors + "$";
			data = data + objects[i].vindex + "$";
			data = data + objects[i].size + "$";
		}
		console.log("logging data\n");
		console.log(data);
		const blob = new Blob([data], {type:'text/plain'});
		if(window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveBlob(blob, filename);
		}
		else{
			const elem = window.document.createElement('a');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = filename;        
			document.body.appendChild(elem);
			elem.click();        
			document.body.removeChild(elem);
		}
	});
	
	//	################### LOAD ###################
	loadButton.addEventListener("change", function(){
		if(loadButton.files.length == 0){
			console.log("No files selected!\n");
			return;
		}
		var fr = new FileReader();
		fr.onload = (e) => { 
			var lines;
			const file = e.target.result; 
			lines = file.split(/\$/);
			for(var i = 0; i < lines.length; i++){
				lines[i] = lines[i].split(',');
			}
			//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			objects = [];
			undoStack = [];
			redoStack = [];
			console.log("logging lines\n");
			console.log(lines);
			curID = 0;
			index = 4;
			var newObjSize = parseInt(lines[0][0]);
			for(var i = 3; i < newObjSize*5+3; i+=5){
				if( lines[i][0] == "" )
					break;
				
				var newID = parseInt(lines[i]);
				var newVertices = parseVerticesMatrix(lines[i+1]);
				var newColors = parseColorMatrix(lines[i+2]);
				var newVindex = parseInt(lines[i+3]);
				var newSize = parseInt(lines[i+4]);
				var createdObject = {
					id: newID,
					vertices: newVertices,
					colors: newColors,
					vindex: newVindex,
					size: newSize
				}
				//objects.push(createdObject);
				//console.log(createdObject);
				//createPolygon( newVertices );
				createPolygonFromInfo( createdObject );
			}
			
			var zoomLoc = gl.getUniformLocation(program, "zoom");	
			zoom = 1;
			gl.uniform1f(zoomLoc,zoom);
			var offsetLoc = gl.getUniformLocation(program, "offset");
			offset = vec2(0.0,0.0);
			gl.uniform2fv(offsetLoc,offset);	 
			render();
			
		}; 
		fr.readAsText(loadButton.files[0]);
	});
	
	
	//Utilty
	function translateCoord(pX, pY){
		//console.log(canvas.height);
		return vec2(
			(2 * pX/canvas.width - 1) / zoom - offset[0], 
			(2 * (canvas.height-pY)/canvas.height - 1) / zoom - offset[1]
			//((2 * pX/canvas.width-1) - offset[0]) / zoom, 
			//((2 * (canvas.height-pY)/canvas.height-1) - offset[1]) / zoom 
		);
					

	}
	
	//Keyboard, Mouse Listeners & Managers
	var isLDrag = false;
	var isRDrag = false;
	var isMDrag = false;
	
	canvas.addEventListener("mousedown", function(event){
		
		if(event.button == 2){ //Right Click
			isRDrag = true;
			isMDrag = false;
			isLDrag = false;
			
			switch(currentFunction){
				case(functions.square):
					p1 = translateCoord(event.clientX, event.clientY);
					
				break;
				case(functions.triangle):
					p1 = translateCoord(event.clientX, event.clientY);
					
				break;
				case(functions.equitri):
					p1 = translateCoord(event.clientX, event.clientY);
				break;
				case(functions.polygon):
					p.push( translateCoord(event.clientX, event.clientY) );
					
				break;
			}
		}
		else if(event.button == 1){ //Middle Click
			isRDrag = false;
			isMDrag = true;
			isLDrag = false;
		}
		else if(event.button == 0){	//Left Click
			isRDrag = false;
			isMDrag = false;
			isLDrag = true;
			
			var selectedPixel = translateCoord(event.clientX, event.clientY);
			//for(var i = 0; i < objects.length; i += 1){
			for(var i = objects.length - 1; i >= 0; i -= 1){
				if(pointInPolygon(objects[i].vertices,selectedPixel)){
					selectedObjectId = objects[i].id;
					currentFunction = currentFunction == functions.selectMultipleObjects 
									? functions.selectMultipleObjects : functions.selectObject;
									
					if(currentFunction == functions.selectMultipleObjects){ //multiple select mode
						selectedObjects.push(objects[i]);
					}
					console.log(selectedObjects);
					break;
				}	
				selectedObjectId = -1;
			}
			console.log(selectedObjectId);
			updateHighlightBox();
			
		}
    } );
	
	var lastRotation = 0.0;
	var lastMovement = vec2(0.0,0.0);
	canvas.addEventListener("mouseup", function(event){
		
		if(event.button == 2){ //Right Click
			isRDrag = false;
			console.log(lastRotation);
			
			//Store event for undo/redo
			if(selectedObjectId != -1 && lastRotation != 0){
				addUndo(selectedObjectId,events.Rotate,lastRotation);
			}
			
			lastRotation = 0.0;
			
			
			switch(currentFunction){
				case(functions.square):
					p2 = translateCoord(event.clientX, event.clientY);
						
					//console.log(p1 + p2);
					
					createSquare(p1,p2);
					
				break;
				case(functions.triangle):
					p2 = translateCoord(event.clientX, event.clientY);
	
					createTriangle(p1,p2);
				break;
				case(functions.equitri):
					p2 = translateCoord(event.clientX, event.clientY);
	
					createEquitri(p1,p2);
				break;
			}
		}
		else if(event.button == 1){ //Right Click
			isMDrag = false;
		}
		else if(event.button == 0){	//Left Click
			isLDrag = false;
			console.log(lastMovement);
			
			//Store event for undo/redo
			if(selectedObjectId != -1 && lastMovement[0] != 0 && lastMovement[1] != 0){
				addUndo(selectedObjectId,events.Move,lastMovement);
			}
			
			lastMovement = vec2(0.0,0.0);
			
		}
    } );
	
	canvas.addEventListener("click", function(event){
		
	});
	
	canvas.addEventListener("mousemove", function(event){
		
		if(isMDrag){
		//var offsetLoc = gl.getUniformLocation(program, "offset");
		
		offset[0] += 2*(event.movementX)/(canvas.width-1) / zoom;
		offset[1] += 2*(-event.movementY)/(canvas.height-1) / zoom;
		//console.log(offset + " -- " + offset[0]);
		gl.uniform2fv(offsetLoc, offset);
		//console.log(event.clientX + " - " + event.clientY);
		}
		else if(isRDrag && currentFunction == functions.selectObject){
			if( selectedObjectId != -1 ){
				var rotationAngle = 2*(event.movementX)/(canvas.width-1);
				lastRotation += rotationAngle;	//update total rotation in the last event

				updateHighlightBox();
				rotateObject(selectedObjectId ,rotationAngle);
			}
		}
		else if(isLDrag && currentFunction == functions.selectObject){
			if( selectedObjectId != -1 ){
				var dx = 2*(event.movementX)/(canvas.width-1) / zoom;
				var dy = 2*(-event.movementY)/(canvas.height-1) / zoom;
				
				lastMovement[0] += dx;	//update total rotation in the last event
				lastMovement[1] += dy;
				
				updateHighlightBox();
				moveObject(selectedObjectId ,dx,dy);
			}
		}
			
	});
	
	canvas.addEventListener("wheel", function(event){
		var zoomBounds = [10,0.1];
		var prevML = translateCoord( event.clientX, event.clientY );
		zoom = Math.max( Math.min( zoom * (1 + (event.deltaY * 0.001)) , zoomBounds[0] ) , zoomBounds[1] );  // 10 > zoom > 0.1
		//var ratioChange = zoom / prevZoom;
		//offset[0] *= ratioChange;
		//offset[1] *= ratioChange;
		gl.uniform1f(zoomLoc,zoom);
		var newML = translateCoord( event.clientX, event.clientY );
		offset[0] += newML[0] - prevML[0];
		offset[1] += newML[1] - prevML[1];
		var offsetLoc = gl.getUniformLocation(program, "offset");
		gl.uniform2fv(offsetLoc, offset);
	});
	
	canvas.addEventListener("mouseleave", function(event){
		isLDrag = false;
		isRDrag = false;
		isMDrag = false;
		updateHighlightBox();
	});
	
	window.addEventListener("keydown", function(event){
		
		switch (event.keyCode) {
			case(46):			//DEL
			if(currentFunction == functions.selectObject) deleteObject(selectedObjectId,false);
			break;
			case (78):			//N
				console.log("n");
				createPolygon(p);
				p = [];				//Clear p array
			break;
			case (90):			//Z
				undo();
			break;
			case (89):			//Y
				redo();
			break;
			case (16):			//Shift
				currentFunction = currentFunction == functions.selectMultipleObjects ? -1 : functions.selectMultipleObjects;
				if(currentFunction == -1) selectedObjects = [];
			break;
			case (67):			//C
				copiedObjects = structuredClone(selectedObjects);
			break;
			case (86):			//V
				pasteCopiedObjects();
			break;
		}

    } );
	
	render();
	
};

function createSquare( p1 , p2 ){
	
	//finalize vertices
	p3 = vec2(p1[0], p2[1]);
	p4 = vec2(p2[0], p1[1]);
	
	//insert vertices as subdata
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(p1));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(p3));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+2), flatten(p2));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+3), flatten(p4));
	
	var c = vec4(colors[curColorIndex]);
	
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(c));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 1), flatten(c));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 2), flatten(c));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 3), flatten(c));
	
	//store oop friendly data of the object in the 'objects' list
	var createdObject = {
		id: curID,
		vertices: [p1,p3,p2,p4],
		colors: [c,c,c,c],
		vindex: index,
		size: 4
	}
	
	objects.push(createdObject);
	
	//Store event for undo/redo
	var ObjectGhostData = structuredClone(createdObject); 
	addUndo(curID,events.Create,ObjectGhostData);
	
	curID += 1;
	index += 4;
}

function createTriangle( p1 , p2 ){
	
	//TODO -> needs to be equilateral => a,a,a
	
	// |                      |
	// v placeholder function v

	p3 = vec2((p1[0] + p2[0]) * 0.5, p1[1]);
	p1 = vec2(p1[0],p2[1]);
	
	
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);

	gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(p1));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(p3));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+2), flatten(p2));

	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	

	var c = vec4(colors[curColorIndex]);

	gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(c));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 1), flatten(c));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 2), flatten(c));
	
	var createdObject = {
		id: curID,
		vertices: [p1,p3,p2],
		colors: [c,c,c],
		vindex: index,
		size: 3
	}
	
	objects.push(createdObject);
	
	//Store event for undo/redo
	//addUndo(curID,events.Create,0);
	var ObjectGhostData = structuredClone(createdObject); 
	addUndo(curID,events.Create,ObjectGhostData);
	
	curID += 1;
	index += 3;
}

function createEquitri( p1 , p2 ){
	
	//TODO -> needs to be equilateral => a,a,a
	
	// |                      |
	// v placeholder function v

	p3 = vec2((p1[0] + p2[0]) * 0.5, p1[1]);
	p1 = vec2(p1[0],p2[1]);

	var l = Math.abs(p2[0] - p1[0]);
	var w = Math.abs(p3[1] - p2[1]);

	if(p2[1]<p3[1]){
		if( (p3[1]-p2[1]) > l ){
			var hipo = l;
			var shortEdge = hipo / 2;
			var newY = Math.sqrt(hipo*hipo - shortEdge*shortEdge);
				p3[1] = p2[1] + newY;
		}
		else{
			var span = w / Math.sqrt(3);
			if(p1[0]>p2[0]){
				p3[0] = p1[0] - span;
				p2[0] = p1[0] - 2*span;
			}
			else{
				p3[0] = p1[0] + span;
				p2[0] = p1[0] + 2*span;
			}
		}
	} 
	else{
		if( (p2[1]-p3[1]) > l ){
			var hipo = l;
			var shortEdge = hipo / 2;
			var newY = Math.sqrt(hipo*hipo - shortEdge*shortEdge);
			p3[1] = p2[1] - newY;
			p3[0] = (p1[0] + p2[0]) * 0.5;
		}
		else{
			var span = w / Math.sqrt(3);
			if(p1[0]>p2[0]){
				p3[0] = p1[0] - span;
				p2[0] = p1[0] - 2*span;
			}
			else{
				p3[0] = p1[0] + span;
				p2[0] = p1[0] + 2*span;
			}
		}
	}
	
	var shorter = true; //if true the shorter edge is between p1-p2


	
	
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);

	gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(p1));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(p3));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+2), flatten(p2));

	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	

	var c = vec4(colors[curColorIndex]);

	gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(c));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 1), flatten(c));
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + 2), flatten(c));
	
	var createdObject = {
		id: curID,
		vertices: [p1,p3,p2],
		colors: [c,c,c],
		vindex: index,
		size: 3
	}
	
	objects.push(createdObject);
	
	//Store event for undo/redo
	//addUndo(curID,events.Create,0);
	var ObjectGhostData = structuredClone(createdObject); 
	addUndo(curID,events.Create,ObjectGhostData);
	
	curID += 1;
	index += 3;
}

function createPolygon( p ){
	
	if(p.length < 3) return;
	
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
	for(var i = 0; i < p.length ; i += 1){
		gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index + i), flatten(p[i]));
	}
	
	var c = vec4(colors[curColorIndex]);
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	
	var newColors = [];
	for(var i = 0; i < p.length ; i += 1){
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + i), flatten(c));
		newColors.push(c);
	}
	
	
	var createdObject = {
		id: curID,
		vertices: p,
		colors: newColors,
		vindex: index,
		size: p.length
	}
	
	objects.push(createdObject);
	
	//Store event for undo/redo
	var ObjectGhostData = structuredClone(createdObject); 
	addUndo(curID,events.Create,ObjectGhostData);
	
	curID += 1;
	index += p.length;
}

function createPolygonFromInfo( object ){

	if(object.vertices.length < 3) return;


	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
	for(var i = 0; i < object.size ; i += 1){
		gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index + i), flatten(object.vertices[i]));
	}
	//var c = vec4(colors[curColorIndex]);
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	var newColors = [];
	for(var i = 0; i < object.size ; i += 1){
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + i), flatten(object.colors[i]));
	}
	
	var createdObject = {
		id: curID,
		vertices: object.vertices,
		colors: object.colors,
		vindex: index,
		size: object.size
	}
	
	objects.push(createdObject);
	
	//Store event for undo/redo
	//var ObjectGhostData = structuredClone(createdObject); 
	//addUndo(curID,events.Create,ObjectGhostData);
	
	curID += 1;
	index += object.vertices.length;
	
	return createdObject.id;
}

function createPolygonFromInfoID( object ){

	if(object.vertices.length < 3) return;


	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
	for(var i = 0; i < object.size ; i += 1){
		gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index + i), flatten(object.vertices[i]));
	}
	//var c = vec4(colors[curColorIndex]);
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	var newColors = [];
	for(var i = 0; i < object.size ; i += 1){
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + i), flatten(object.colors[i]));
	}
	
	var createdObject = {
		id: object.id,
		vertices: object.vertices,
		colors: object.colors,
		vindex: index,
		size: object.size
	}
	
	objects.push(createdObject);
	
	//Store event for undo/redo
	//var ObjectGhostData = structuredClone(createdObject); 
	//addUndo(curID,events.Create,ObjectGhostData);
	
	//curID += 1;
	index += object.size;
	
	return createdObject.id;
}

function rotateObject(ind,theta){
	
	//
	//	ToDo - erroneous
	//
	
	var selectedIndex = -1;
	var geoCenter;
	selectedIndex = objects.indexOf(objects.find( obj => {return obj.id === ind } ));	//find object
	
	if(1){
		//calculate geoCenter
		var sum = vec2(0.0,0.0);
		for(var i = 0; i < objects[selectedIndex].vertices.length; i+=1){
			sum[0] += objects[selectedIndex].vertices[i][0];
			sum[1] += objects[selectedIndex].vertices[i][1];
		}
		geoCenter = vec2( sum[0] / objects[selectedIndex].size , sum[1] / objects[selectedIndex].size );;
		//console.log(geoCenter);
		
		//rotate vertices around the geocenter and update objects list as well as vertex buffer subdata
		gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);	//bind vertex buffer
		for(var i = 0; i < objects[selectedIndex].size; i+=1){
			var dx = objects[selectedIndex].vertices[i][0] - geoCenter[0];
			var dy = objects[selectedIndex].vertices[i][1] - geoCenter[1];
			
			var s = Math.sin( -2 * theta );
			var c = Math.cos( -2 * theta );
			
			var dxn = -s * dx + c * dy;
			var dyn = s * dy + c * dx;
			
			var newVertice = vec2( geoCenter[0] + dyn, geoCenter[1] + dxn );
			
			objects[selectedIndex].vertices[i] = newVertice;	//Update vertice
			
			gl.bufferSubData(gl.ARRAY_BUFFER, 8*(objects[selectedIndex].vindex + i), flatten(newVertice));
			
		}
	}
	
}

function moveObject(ind ,dx,dy){
	var selectedIndex = -1;
	selectedIndex = objects.indexOf(objects.find( obj => {return obj.id === ind } ));
	
	if(1){
		gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);	//bind vertex buffer
		for(var i = 0; i < objects[selectedIndex].vertices.length; i+=1){
			
			var newVertice = vec2( objects[selectedIndex].vertices[i][0] + dx, objects[selectedIndex].vertices[i][1] + dy );
			
			objects[selectedIndex].vertices[i] = newVertice;	//Update vertice
			
			gl.bufferSubData(gl.ARRAY_BUFFER, 8*(objects[selectedIndex].vindex + i), flatten(newVertice));
		}
	}
}

function updateHighlightBox(points){ //This function finds the smallest rectangle that contains the given points and updates highlight box accordingly
	var selectedIndex = -1;
	selectedIndex = objects.indexOf(objects.find( obj => {return obj.id === selectedObjectId } ));
	
	var points
	if(selectedIndex != -1) {points = objects[selectedIndex].vertices;}
	else{
	points = [vec2(0.0,0.0)];
	} 
	
	var min, max;
	minx = points[0][0];
	maxx = points[0][0];
	miny = points[0][1];
	maxy = points[0][1];
	
	for(var i = 0; i < points.length; i+= 1){
		minx = Math.min(minx , points[i][0]);
		miny = Math.min(miny , points[i][1]);
		
		maxx = Math.max(maxx , points[i][0]);
		maxy = Math.max(maxy , points[i][1]);
	}
	
	var p1 = vec2(minx,miny);
	var p2 = vec2(maxx,miny);
	var p3 = vec2(maxx,maxy);
	var p4 = vec2(minx,maxy);
	
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*0, flatten(p1));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(0+1), flatten(p2));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(0+2), flatten(p3));
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*(0+3), flatten(p4));
	
}

function deleteObject(ind,isRedo){
	if(1) //If an object is currently selected
				console.log("deleting" + ind);
				//DELETE
				selectedIndex = objects.indexOf(objects.find( obj => {return obj.id === ind } ));
				
				
				if(!isRedo){
					addUndo(ind,events.Delete,objects[selectedIndex]);
				}
				
				gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);	//bind vertex buffer
				for(var i = 0; i < objects[selectedIndex].vertices.length; i+=1){
					var nullVertice = vec2(0.0,0.0);
					gl.bufferSubData(gl.ARRAY_BUFFER, 8*(objects[selectedIndex].vindex + i), flatten(nullVertice));
				}
				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);	//bind color buffer
				for(var i = 0; i < objects[selectedIndex].vertices.length; i+=1){
					var nullVertice = vec4(0.0,0.0,0.0,0.0);
					gl.bufferSubData(gl.ARRAY_BUFFER, 16*(objects[selectedIndex].vindex + i), flatten(nullVertice));
				}
				
				objects.splice(selectedIndex, 1); //remove object from objects array
				selectedIndex = -1;

				updateHighlightBox();
				//console.log(objects);
}

function addUndo(id, mode, _info){
	
	redoStack = []; //reste redo Stack
	
	var thisEvent = 
	{
		objId: id,
		ev: mode,
		info: _info
	};
	
	if(undoStack.length >= 10) undoStack.shift();
	undoStack.push(thisEvent);
	
	console.log(undoStack);
}

function undo(){
	var thisEvent = undoStack.pop();
	if(thisEvent == undefined) return;
	
	if(redoStack.length >= 10) redoStack.shift();
	redoStack.push(thisEvent);
	
	console.log(undoStack);
	console.log(redoStack);
	
	if(thisEvent != null){
		switch(thisEvent.ev){
			case(events.Create):
				deleteObject(thisEvent.objId,true);
				break;
			case(events.Rotate):
				rotateObject(thisEvent.objId,-thisEvent.info);
				break;
			case(events.Move):
				thisEvent.info[0] *= -1;
				thisEvent.info[1] *= -1;
				moveObject(thisEvent.objId, thisEvent.info[0], thisEvent.info[1]);
				break;
			case(events.Delete):
				createPolygonFromInfoID(thisEvent.info);
				break;
		}
	}
}

function redo(){
	
	var thisEvent = redoStack.pop();
	if(thisEvent == undefined) return;
	
	if(undoStack.length >= 10) undoStack.shift();
	undoStack.push(thisEvent);
	
	console.log(undoStack);
	console.log(redoStack);
	
	if(thisEvent != null){
		switch(thisEvent.ev){
			case(events.Create):
			
				var nid = createPolygonFromInfoID(thisEvent.info);

				//Correct the id of the last element in the stack
				/*
				thisEvent = undoStack.pop();
				thisEvent.info.id = nid;
				thisEvent.objId = nid;
				*/
				//undoStack.push(thisEvent);
				
				
				break;
			case(events.Rotate):
				rotateObject(thisEvent.objId, thisEvent.info);

				break;
			case(events.Move):
				thisEvent.info[0] *= -1;
				thisEvent.info[1] *= -1;
				moveObject(thisEvent.objId, thisEvent.info[0], thisEvent.info[1]);

				break;
			case(events.Delete):
				deleteObject(thisEvent.objId,true);
				break;
		}
	}
	
}

function pasteCopiedObjects(){
	for(var i = 0; i < copiedObjects.length ; i+= 1){
		let obj = copiedObjects[i];
		for(var j = 0; j < obj.size ; j+= 1){
			obj.vertices[j][0] += 0.1;
			obj.vertices[j][1] += 0.1;
		}
		createPolygonFromInfo(obj);
	}
}

//This function is taken from https://www.algorithms-and-technologies.com/point_in_polygon/javascript
//This function checks whether the point lies inside a polygon
const pointInPolygon = function (polygon, point) {
    //A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
    let odd = false;
    //For each edge (In this case for each point of the polygon and the previous one)
    for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
        //If a line from the point into infinity crosses this edge
        if (((polygon[i][1] > point[1]) !== (polygon[j][1] > point[1])) // One point needs to be above, one below our y coordinate
            // ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
            && (point[0] < ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]))) {
            // Invert odd
            odd = !odd;
        }
        j = i;

    }
    //If the number of crossings was odd, the point is in the polygon
    return odd;
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT ); 
	//console.log(objects);
	
	//Draw 'objects'
	for(var i = 0; i < objects.length ; i+= 1){
		let obj = objects[i];
		
		gl.drawArrays( gl.TRIANGLE_FAN, obj.vindex, obj.size );
	}
	
	gl.drawArrays( gl.LINE_LOOP, 0, 4 ); //Draw selection highlight box
	
	//Draw the borders of selected object(s)	
	
   //gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
   //console.log(isDrag);
   window.requestAnimFrame(render);
}

function parseColorMatrix( colors ){
	var result = [];
	for( var i = 0; i < colors.length; i+=4 ){
		result.push([parseFloat(colors[i]), parseFloat(colors[i+1]), parseFloat(colors[i+2]), parseFloat(colors[i+3])]);
	}
	return result;
}

function parseVerticesMatrix( vertices ){
	var result = [];
	for( var i = 0; i < vertices.length; i+=2 ){
		result.push([parseFloat(vertices[i]), parseFloat(vertices[i+1])]);
	}
	return result;
}