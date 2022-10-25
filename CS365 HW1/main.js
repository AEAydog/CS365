/*
var createdObject = {
		id: curID,
		vertices: [p1,p3,p2],
		colors: [c,c,c,c],
		vindex: index,
		size: 3
	}
*/

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
	moveCamera:4
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
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW ); 
	
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
	//--UI FUNCTIONALITIES--
	 
	//UI Event Listeners
	var shapeMenu = document.getElementById( "shape-menu" );
	var colorMenu = document.getElementById( "color-menu" );
	var saveButton = document.getElementById( "save-button" );
	var loadButton = document.getElementById( "load-button" );
	var undoButton = document.getElementById( "undo-button" );
	var redoButton = document.getElementById( "redo-button" );
	
	shapeMenu.addEventListener("click", function(){
		switch(shapeMenu.selectedIndex){
			case(0):
				currentFunction = functions.square;
			break;
			case(1):
				currentFunction = functions.triangle;
			break;
			case(2):
				currentFunction = -1; //Circle
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
		for(var i = 0; i < objects.length; i++){
			data = data + objects[i].id + "$";
			data = data + objects[i].vertices + "$";
			data = data + objects[i].colors + "$";
			data = data + objects[i].vindex + "$";
			data = data + objects[i].size + "$";
		}
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
			//objects = [];
			console.log("logging lines\n");
			console.log(lines);
			curID = parseInt(objects[1]);
			console.log(curID);
			/*
			for(var i = 0; i < lines[0].length / 2; i++){ // get points array from file
				points.push(vec2(parseFloat(lines[0][2*i]),parseFloat(lines[0][2*i+1])));
			}
			for(var i = 0; i < lines[1].length; i++){ //get color arr from file
				colorArr[i] = parseFloat(lines[1][i]);
			}
			
			index = parseFloat(lines[2][0]); // get current index from file
			
			first = parseFloat(lines[3][0]); // get whether first line is drawn or not

			draw = parseFloat(lines[4][0]); // get whether polygon is drawn or not
			recursion = parseFloat(lines[5][0]); // get the number of recursion from file
			for(var i = 0; i < lines[6].length / 2; i++){  // get reccured points from the file
				recPoints.push(vec2(parseFloat(lines[6][2 * i]),parseFloat(lines[6][2 * i+1])));
			}
			for(var i = 0; i < lines[7].length / 4; i++){ // get recurred colors from the file
				recColors.push(vec4(parseFloat(lines[7][4 * i]),parseFloat(lines[7][4* i+1]),parseFloat(lines[7][4*i+2]),parseFloat(lines[7][4*i+3])));
			}
			clearCol = vec4(parseFloat(lines[8][0]),parseFloat(lines[8][1]),parseFloat(lines[8][2]),parseFloat(lines[8][3])); // get last clear color from file
			
			//initialise buffers and clear color
			gl.clearColor(clearCol[0],clearCol[1],clearCol[2],1);
			gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(recPoints));
			gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(recColors));
			
			render();
			*/
		}; 
		fr.readAsText(loadButton.files[0]);
	});
	
	undoButton.addEventListener("click", function(){

	});
	
	redoButton.addEventListener("click", function(){

	});
	
	
	//Utilty
	function translateCoord(pX, pY){
		console.log(canvas.height);
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
				case(functions.polygon):
					p.push( translateCoord(event.clientX, event.clientY) );
					
				break;
			}
		}
		else if(event.button == 1){ //Right Click
			isRDrag = false;
			isMDrag = true;
			isLDrag = false;
		}
		else if(event.button == 0){	//Left Click
			isRDrag = false;
			isMDrag = false;
			isLDrag = true;
		
			
		}
    } );
	
	canvas.addEventListener("mouseup", function(event){
		
		if(event.button == 2){ //Right Click
			isRDrag = false;
			
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
			}
		}
		else if(event.button == 1){ //Right Click
			isMDrag = false;
		}
		else if(event.button == 0){	//Left Click
			isLDrag = false;
			
		}
    } );
	
	canvas.addEventListener("click", function(event){
		if(event.button == 0){	//Left Click
		
			//Find oobject Id in clicked point
			var selectedPixel = translateCoord(event.clientX, event.clientY);
			for(var i = 0; i < objects.length; i += 1){
				if(pointInPolygon(objects[i].vertices,selectedPixel)){
					selectedObjectId = objects[i].id
					break;
				}	
				selectedObjectId = -1;
			}
			console.log(selectedObjectId);
		}
		
	});
	
	canvas.addEventListener("mousemove", function(event){
		
		if(isMDrag){
		var offsetLoc = gl.getUniformLocation(program, "offset");
		
		offset[0] += 2*(event.movementX)/(canvas.width-1) / zoom;
		offset[1] += 2*(-event.movementY)/(canvas.height-1) / zoom;
		//console.log(offset + " -- " + offset[0]);
		gl.uniform2fv(offsetLoc, offset);
		//console.log(event.clientX + " - " + event.clientY);
		}
		else if(isRDrag){
			if( selectedObjectId != -1 ){
				var rotationAngle = 2*(event.movementX)/(canvas.width-1);
				console.log(rotationAngle);
				rotateSelectedObject(rotationAngle);
			}
		}
		else if(isLDrag){
			if( selectedObjectId != -1 ){
				var dx = 2*(event.movementX)/(canvas.width-1) / zoom;
				var dy = 2*(-event.movementY)/(canvas.height-1) / zoom;
				
				moveSelectedObject(dx,dy);
			}
		}
			
	});
	
	canvas.addEventListener("wheel", function(event){

		zoom = Math.max( Math.min( zoom * (1 + (event.deltaY * 0.001)) , 10 ) , 0.1 );  // 10 > zoom > 0.1		
		gl.uniform1f(zoomLoc,zoom);
	});
	
	canvas.addEventListener("mouseleave", function(event){
		isLDrag = false;
		isRDrag = false;
		isMDrag = false;
	});
	
	window.addEventListener("keydown", function(event){
		
		switch (event.keyCode) {
			case(46):			//DEL
			console.log("currently in DEL");
			if(selectedObjectId != -1){ //If an object is currently selected
				console.log("deleting" + selectedObjectId);
				//DELETE
				selectedIndex = objects.indexOf(objects.find( obj => {return obj.id === selectedObjectId } ));
				
				gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);	//bind vertex buffer
				for(var i = 0; i < objects[selectedIndex].vertices.length; i+=1){
					var nullVertice = vec2(0.0,0.0);
					gl.bufferSubData(gl.ARRAY_BUFFER, 8*(objects[selectedIndex].vindex + i), flatten(nullVertice));
				}
				
				gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);	//bind vertex buffer
				for(var i = 0; i < objects[selectedIndex].vertices.length; i+=1){
					var nullVertice = vec4(0.0,0.0,0.0,0.0);
					gl.bufferSubData(gl.ARRAY_BUFFER, 16*(objects[selectedIndex].vindex + i), flatten(nullVertice));
				}
				
				objects.splice(selectedIndex, 1); //remove object from objects array
				selectedIndex = -1;
				
				console.log(objects);
			}
			break;
			case (78):			//N
				console.log("n");
				createPolygon(p);
				p = [];				//Clear p array
			break;
			case (1):
				var dsaasd = 0;
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


	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
	
	var c = vec4(colors[curColorIndex]);

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
		colors: [c,c,c,c],
		vindex: index,
		size: 3
	}
	
	objects.push(createdObject);
	
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
	
	for(var i = 0; i < p.length ; i += 1){
		gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index + i), flatten(c));
	}
	
	
	var createdObject = {
		id: curID,
		vertices: p,
		colors: p,
		vindex: index,
		size: p.length
	}
	
	objects.push(createdObject);
	
	curID += 1;
	index += p.length;
}

function rotateSelectedObject(theta){
	
	//
	//	ToDo - erroneous
	//
	
	var selectedIndex = -1;
	var geoCenter;
	selectedIndex = objects.indexOf(objects.find( obj => {return obj.id === selectedObjectId } ));	//find object
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

function moveSelectedObject(dx,dy){
	var selectedIndex = -1;
	selectedIndex = objects.indexOf(objects.find( obj => {return obj.id === selectedObjectId } ));
	
	if(1){
		gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);	//bind vertex buffer
		for(var i = 0; i < objects[selectedIndex].vertices.length; i+=1){
			
			var newVertice = vec2( objects[selectedIndex].vertices[i][0] + dx, objects[selectedIndex].vertices[i][1] + dy );
			
			objects[selectedIndex].vertices[i] = newVertice;	//Update vertice
			
			gl.bufferSubData(gl.ARRAY_BUFFER, 8*(objects[selectedIndex].vindex + i), flatten(newVertice));
		}
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
	for(var i = 0; i < objects.length ; i+= 1){
		let obj = objects[i];
		
		gl.drawArrays( gl.TRIANGLE_FAN, obj.vindex, obj.size );
	}
   //gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
   //console.log(isDrag);
   window.requestAnimFrame(render);
}
