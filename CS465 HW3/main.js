
var canvas;
var gl;
var program;

//Matrices
var projectionMatrix; 
var modelViewMatrix;
var instanceMatrix;
var forestCameraMatrix;
var forestCameraAngle;
var forestCameraZoom

var modelViewMatrixLoc;

//Lighting and shading
var lightPosition = vec4(-100.0,-100.0, -100.0, 0.0 );
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var matColor = vec4(0.5, 0.25, 0.0, 1.0); //Brown

var colors = {
	normal: vec4(0.5, 0.25, 0.0, 1.0),
	selected: vec4(0.0,1.0,1.0,1.0),
    ground: vec4(0.0, 1.0, 0.0, 1.0),
}

var colorArray = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),   // cyan
	vec4( 1.0, 1.0, 1.0, 1.0 )   // White
];

var materialAmbient = matColor;//vec4( 1.0, 0.8, 0.0, 1.0 );
var materialDiffuse = matColor;//vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = matColor;//vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 1.0;

var groundSize = 1000;

var clipX = 0;
var clipY = 0;

//var vertices = [
//
//    vec4( -0.5, -0.5,  0.5, 1.0 ),
//    vec4( -0.5,  0.5,  0.5, 1.0 ),
//    vec4( 0.5,  0.5,  0.5, 1.0 ),
//    vec4( 0.5, -0.5,  0.5, 1.0 ),
//    vec4( -0.5, -0.5, -0.5, 1.0 ),
//    vec4( -0.5,  0.5, -0.5, 1.0 ),
//    vec4( 0.5,  0.5, -0.5, 1.0 ),
//    vec4( 0.5, -0.5, -0.5, 1.0 )
//];

//Tree
var trunkId = 0;
var branch1Id = 3;
var b2uId = 1;
var b2lId = 2;

var maxBranches = 40;

var trunkHeight = 5.0;
var trunkWidth = 1.0;
var branchlvl1Height = 3.5;
var branchlvl1Width  = 0.5;
var branchlvl2Height = 2.0;
var branchlvl2Width  = 0.3;
var branchStdHeight = 4.0;
var branchStdWidth = 0.4;

var numNodes;
var angle = 0;

var stack = [];

var figure = [];

var forestFigure = [];
var forestNum;

//hierarchial nodes
var hNodes = [];


var framebuffer;
var vBuffer;
var modelViewLoc;

var pointsArray = [];
var normalsArray = [];
var ibufferSize;
var toggleShading = 1;
var toggleForest = 0;
var isDrawingOffScr = false;
var color = new Uint8Array(4);
var selectedID = -1;
//-------------------------------------------

function bakeColor(){

	materialAmbient = matColor;//vec4( 1.0, 0.8, 0.0, 1.0 );
	materialDiffuse = matColor;//vec4( 1.0, 0.8, 0.0, 1.0);
	materialSpecular = matColor;//vec4( 1.0, 0.8, 0.0, 1.0 );

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
	
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
}

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child, type, width, height, parent, id, tx, ty, tz, placement){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    type: type,
    width: width,
    height: height,
    parent: parent,
    id: id,
    tx: tx,
    ty: ty,
    tz: tz,
    placement: placement,
    }
    return node;
}

function angleChange(theta, type){
    var angle = {
        theta: theta,
        type: type,
    }
    return angle;
}

function wDev() {
    return (0.5 + Math.random() * 0.2);
 }

function hDev() {
    return (0.4 + Math.random() * 0.2);
}

//ensure that the angle is between 20-70
function randomAngle() {
    var pos = Math.floor(Math.random() * 3) - 1;
    var res = (Math.floor(Math.random() * 51) + 20);
    if( pos >= 0 )
        return res;
    else
        return -res;
}

function angleToRadian(angle){
    return (angle * (Math.PI / 180.0));
}

function changeCamera(theta) {
        var m = mat4();
        m = rotate(theta, 0, 1, 0 );
        figure[0].transform = m;
}

function forestCamera() {
    var m = mat4();
    m = mult(figure[0].transform, forestCameraMatrix);
    figure[0].transform = m;
}

function reverseForestCamera() {
    var m = mat4();
    m = mult(forestCameraMatrix, rotate(-2*forestCameraAngle, 1, 0, 0));
    m = mult(figure[0].transform, m);
    figure[0].transform = m;
}

function changeNodeAngle(Id, thetaI){

    var m = mat4();
    switch(thetaI.type){
        case "x":
            figure[Id].tx = thetaI.theta;
        break;
        case "y":
            figure[Id].ty = thetaI.theta;
        break;
        case "z":
            figure[Id].tz = thetaI.theta;
        break;
    }
    m = translate(0.0, figure[Id].placement, 0.0);
    m = mult(m, rotate(figure[Id].tx, 1, 0, 0));
    m = mult(m, rotate(figure[Id].ty, 0, 1, 0));
    m = mult(m, rotate(figure[Id].tz, 0, 0, 1));
    figure[Id].transform = m;

}


function randomizeTree() {

    //createNode(transform, render, sibling, child, type, width, height, parent, id, angle x, y, z, placement on parent)
    /*
        randomize trunk height and width
        anything branching from a base is:
        0.5 to 0.7 in width, 0.4 to 0.6 in height
    */

    var genQueue = [];


    numNodes = 1;
    trunkHeight = 10.0 + Math.random() * 2;
    trunkWidth = 1.0 + Math.random() * 0.5 ;
    
    var m = mat4();
    m = rotate(0, 0, 1, 0);
    figure[0] = createNode(m, ground, null, 1, null, 1000, 0.1, null, 0, 0, 0, 0, 0);
    figure[numNodes] = createNode( m, trunk, null, null, 0, trunkWidth, trunkHeight, null, numNodes, 0, 0, 0, 0);
    genQueue.push(numNodes);
    numNodes++;

    while( genQueue.length > 0 && numNodes < maxBranches ){
        var top = genQueue.shift();
        var parent = top;
        var mark1 = true;
        //3 to 5 branches from an existing branch
        var newBranchesCount = 3 + Math.floor(Math.random() * 3);
        for( let i = 0; i < newBranchesCount; i++ ){
 
			var m = mat4();
            var randPlacement = figure[parent].type == 0 ? figure[parent].height : figure[parent].height * Math.random();
            var randX = randomAngle();
            var randY = randomAngle();
            var randZ = randomAngle();
            m = translate(0.0, randPlacement, 0.0);
            m = mult(m, rotate(randX, 1, 0, 0));
            m = mult(m, rotate(randY, 0, 1, 0));
            m = mult(m, rotate(randZ, 0, 0, 1));
            figure[numNodes] = createNode( m, branchLvl2, null, null, 2, figure[parent].width*wDev(), figure[parent].height*hDev(), parent, numNodes, randX, randY, randZ, randPlacement );
            if( mark1 ){
                figure[parent].child = numNodes;
            }
            else{
                figure[numNodes-1].sibling = numNodes;
            }
            mark1 = false;
            genQueue.push(numNodes);
            numNodes++;
        }
    }
}

function treeOnClick(ex, ey, ez) {

    //createNode(transform, render, sibling, child, type, width, height, parent, id, angle x, y, z, placement on parent)
    /*
        randomize trunk height and width
        anything branching from a base is:
        0.5 to 0.7 in width, 0.4 to 0.6 in height
    */

    var genQueue = [];

    var figures = [];

    var count = 0;
    trunkHeight = 10.0 + Math.random() * 2;
    trunkWidth = 1.0 + Math.random() * 0.5 ;
    
    //var startX = Math.random() * 50;
    //var startY = Math.random() * 50;
    //var startZ = Math.random() * 50;

    var startX = ex;
    var startY = ey;
    var startZ = ez;

    var m = mat4();
    m = translate(startX, startY, startZ);
    figures[count] = createNode( m, branchStd, null, null, 0, trunkWidth, trunkHeight, null, count, 0, 0, 0, 0);
    genQueue.push(count);
    count++;

    while( genQueue.length > 0 && count < maxBranches ){
        var top = genQueue.shift();
        var parent = top;
        var mark1 = true;
        //3 to 5 branches from an existing branch
        var newBranchesCount = 3 + Math.floor(Math.random() * 3);
        for( let i = 0; i < newBranchesCount; i++ ){
 
			var m = mat4();
            var randPlacement = figures[parent].type == 0 ? figures[parent].height : figures[parent].height * Math.random();
            var randX = randomAngle();
            var randY = randomAngle();
            var randZ = randomAngle();
            m = translate(0.0, randPlacement, 0.0);
            m = mult(m, rotate(randX, 1, 0, 0));
            m = mult(m, rotate(randY, 0, 1, 0));
            m = mult(m, rotate(randZ, 0, 0, 1));
            figures[count] = createNode( m, branchStd, null, null, 2, figures[parent].width*wDev(), figures[parent].height*hDev(), parent, count, randX, randY, randZ, randPlacement );
            if( mark1 ){
                figures[parent].child = count;
            }
            else{
                figures[count-1].sibling = count;
            }
            mark1 = false;
            genQueue.push(count);
            count++;
        }
    }
    forestFigure[forestNum] = figures;
    forestNum++;
    console.log("Generated forest tree: " + forestNum);
    console.log(forestFigure[forestNum-1]);
}

function traverse(Id) {
    if(Id == null) return; 
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render(Id);
    if(figure[Id].child != null) traverse(figure[Id].child); 
        modelViewMatrix = stack.pop();
    if(figure[Id].sibling != null) traverse(figure[Id].sibling); 
}

function forestTraverse(forestId, Id){
    if(Id == null) return; 
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, forestFigure[forestId][Id].transform);
    forestFigure[forestId][Id].render(forestId, Id);
    if(forestFigure[forestId][Id].child != null) traverse(forestFigure[forestId][Id].child); 
        modelViewMatrix = stack.pop();
    if(forestFigure[forestId][Id].sibling != null) traverse(forestFigure[forestId][Id].sibling); 
}

/*
instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
*/

function Draw(Id){
	if(isDrawingOffScr){
		gl.uniform1i(gl.getUniformLocation(program, "i"), Id);
	}
	
	if(selectedID == Id){
		matColor = colors.selected;
		bakeColor();
		
		gl.drawArrays(gl.TRIANGLES, 0, ibufferSize);
		
		matColor = colors.normal;
		bakeColor();
	} else if(Id == 0){
		matColor = colors.ground;
		bakeColor();
		
		gl.drawArrays(gl.TRIANGLES, 0, ibufferSize);
		
		matColor = colors.normal;
		bakeColor();
    }
	else{
		gl.drawArrays(gl.TRIANGLES, 0, ibufferSize);
	}
}

function ground(Id){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    Draw(Id);
}

function trunk(Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    //for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	Draw(Id);
}

function branchStd(forestId, Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * forestFigure[forestId][Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( forestFigure[forestId][Id].width, forestFigure[forestId][Id].height, forestFigure[forestId][Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    //for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	Draw(Id);
	
	gl.drawArrays(gl.TRIANGLES, 0, ibufferSize);
}

function branchLvl1(Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    //for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	Draw(Id);
	
	gl.drawArrays(gl.TRIANGLES, 0, ibufferSize);
}

function branchLvl2(Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    //for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
	
	Draw(Id);
	
	gl.drawArrays(gl.TRIANGLES, 0, ibufferSize);
}

function idColor(x){
	var r,g,b;
	r = int(mod(x, 255));
	g = int(x / 255);
	b = int(x / (255 * 255));
	return vec3( r / 255.0, g / 255.0, b / 255.0, 1.0 );
}

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]); 
     pointsArray.push(vertices[b]); 
     pointsArray.push(vertices[c]);     
     pointsArray.push(vertices[d]);    
}


function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function createTube(n, h, s){
	
	var scalingfactor = [ 0.5, 1 / (h-1) ];
	var ch =  1 - s;
	
	var indices = [];
	var vertices2 = [];
	var vertices = [];
	ibufferSize = 6 * n * h; //how many indices will be pushed for the polygon to the ibufffer
	
	for(var j = 0 ; j < h ; j++){
		for(var i = 0 ; i < n ; i++){
			vertices2.push(vec4( (1- ch * j/(h-1)) * Math.cos(i * 2 * Math.PI / n), j - (h -1) / 2 , (1- ch * j/(h-1)) * Math.sin(i * 2 * Math.PI / n),1.0));
			
		}
	}
	vertices2.push(vec4(0.0, -(h - 1) / 2,0.0,1.0)); // root center
	vertices2.push(vec4(0.0, (h - 0.6) / 2 ,0.0,1.0)); // roof center
	var rootind = n * h;
	var roofind = rootind + 1;
	
	//console.log(vertices2);
	
	//Base indices
	for(var a = 0 ; a < n ; a++){
			indices.push(rootind);
			indices.push((a + 0) % n);
			indices.push((a + 1) % n);
		}
	
	//Side indices
	for(var j = 0 ; j < h - 1  ; j++){
		for(var a = 0 ; a < n ; a++){
			indices.push((a + 0) % n + n * (j));
			indices.push((a + 0) % n + n * (j + 1));
			indices.push((a + 1) % n + n * (j + 1));
			indices.push((a + 0) % n + n * (j));
			indices.push((a + 1) % n + n * (j + 1));
			indices.push((a + 1) % n + n * (j));
		}
	}
	
	//Roof indices
	for(var a = 0 ; a < n ; a++){
			indices.push(roofind);
			indices.push((a + 1) % n + n * (h - 1));
			indices.push((a + 0) % n + n * (h - 1));
		}
	
	//construct all vertices from indices
	for(var p = 0 ; p < ibufferSize; p++){
		
		vertices.push(vertices2[indices[p]]);
	}
	
	
	
	//Set Normals
	for(var p = 0 ; p < ibufferSize - 1; p += 3){
		var p1 = vertices[p];
		var p2 = vertices[p + 1];
		var p3 = vertices[p + 2];
		
		var t1 = subtract(p1, p2);
		var t2 = subtract(p3, p2);
		var normal = cross(t1, t2);
		var normal = vec3(normal);
		normal = normalize(normal);
		//console.log(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
	}
	
	//Rescale the tube for dimensions (1,1,1) with origin (0,0,0)
	for(var p = 0 ; p < ibufferSize; p ++){
		pt = vertices[p];
		vertices[p] = vec4(pt[0] * scalingfactor[0], pt[1] * scalingfactor[1], pt[2] * scalingfactor[0] , 1.0); 
	}
	
	pointsArray = vertices;
	
}

function drawGround(){
    pointsArray.push(vec4( groundSize, 0,  groundSize, 1.0 )); 
    pointsArray.push(vec4( -groundSize, 0,  groundSize, 1.0 )); 
    pointsArray.push(vec4( groundSize, 0,  -groundSize, 1.0 )); 
    pointsArray.push(vec4( -groundSize, 0,  -groundSize, 1.0 ));
    
    var p1 = pointsArray[0];
	var p2 = pointsArray[1];
	var p3 = pointsArray[2];
	var t1 = subtract(p1, p2);
	var t2 = subtract(p3, p2);
	var normal = cross(t1, t2);
	var normal = vec3(normal);
	normal = normalize(normal);
	//console.log(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
    
    //gl.drawArrays(gl.TRIANGLES, 0, 4);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");
    
    gl.useProgram( program);
	
	gl.enable(gl.DEPTH_TEST);	
    
	instanceMatrix = mat4();

    forestNum = 0;
    
    var zoom = 20.0;
    projectionMatrix = ortho(-zoom,zoom, -zoom * 0.3, zoom * 1.7,-zoom,zoom);
    modelViewMatrix = mat4();
    forestCameraMatrix = mat4();
    forestCameraAngle = 90;
    forestCameraZoom = 1;
    forestCameraMatrix = mult( forestCameraMatrix, translate(0, 0, 0));
    //forestCameraMatrix = mult( forestCameraMatrix, ortho(-forestCameraZoom,forestCameraZoom, -forestCameraZoom * 0.3, forestCameraZoom * 1.7,-forestCameraZoom,forestCameraZoom));
    forestCameraMatrix = mult( forestCameraMatrix, rotate(forestCameraAngle, 1, 0, 0));
    //set camera
    //modelViewMatrix = mult(modelViewMatrix, cameraMatrix);
    //modelViewMatrix = mult(modelViewMatrix, projectionMatrix);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
	
	console.log("Shading: " + toggleShading);
	
	
	
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );  
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    
	gl.uniform1i(gl.getUniformLocation(program, "i"),selectedID);
	gl.uniform1i(gl.getUniformLocation(program, "li"), toggleShading);
	
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")
    
	
	
    //cube();
    
    //drawGround();

	createTube(12,4, 0.6);
	
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
    
    vBuffer = gl.createBuffer();
        
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
	
	
	
    document.getElementById("slider0").onchange = function() {
        var tempTheta = event.srcElement.value;
        changeCamera(tempTheta);
    };

    document.getElementById("slider1").onchange = function() {
        var tempTheta = event.srcElement.value;
        var tempAngle = angleChange(tempTheta, "x");
        if(selectedID != -1)
            changeNodeAngle(selectedID, tempAngle);
    };

    document.getElementById("slider2").onchange = function() {
        var tempTheta = event.srcElement.value;
        var tempAngle = angleChange(tempTheta, "y");
        if(selectedID != -1)
            changeNodeAngle(selectedID, tempAngle);
    };

    document.getElementById("slider3").onchange = function() {
        var tempTheta = event.srcElement.value;
        var tempAngle = angleChange(tempTheta, "z");
        if(selectedID != -1)
            changeNodeAngle(selectedID, tempAngle);
    };
	
	
	document.getElementById("checkbox0").onchange = function() {
        toggleShading = event.target.checked ? 1 : 0;
		console.log("Shading: " + toggleShading);
		gl.uniform1i(gl.getUniformLocation(program, "li"), toggleShading); // ######################### CALISMIYOR
        traverse(trunkId);
        for( let i = 0; i < forestNum; i++)
            forestTraverse(i, 0);
    };

    document.getElementById("checkbox1").onchange = function() {
        toggleForest = event.target.checked ? 1 : 0;
		console.log("Forest: " + toggleForest);
        if( toggleForest == 1 ){
            forestCamera();
            document.getElementById("tree-button").style.visibility="visible";
        }
        else{
            reverseForestCamera();
            document.getElementById("tree-button").style.visibility="hidden";
        }
        traverse(trunkId);
        for( let i = 0; i < forestNum; i++)
            forestTraverse(i, 0);
    };

    document.getElementById("tree-button").addEventListener("click", function(){
        console.log("test");
	});
	
	canvas.addEventListener("mousedown", function(event){
        
		//input
        var x = event.clientX;
        var y = canvas.height -event.clientY;
        //console.log("X: " + x);
        //console.log("Y: " + y);
        if(toggleForest == 1){
            treeOnClick(x,0,-y);
            /*
            const rect = canvas.getBoundingClientRect();
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
            clipX = x / rect.width  *  2 - 1;
            clipY = y / rect.height * -2 + 1;
            var invMatrix = mat4();
            invMatrix = matInverse(figure[0].transform);
            //console.log(figure[0].transform);
            //console.log(invMatrix);
            var point = mat4();
            */
            return;
        }
        //Setup
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.clear( gl.COLOR_BUFFER_BIT);
		//Draw
		isDrawingOffScr = true;
        traverse(trunkId);
        for( let i = 0; i < forestNum; i++)
            forestTraverse(i, 0);
        
		
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
		console.log("Color: " + color);
		
        if(color[1] == 128){
            document.getElementById("slider1").style.visibility="hidden";
            document.getElementById("slider2").style.visibility="hidden";
            document.getElementById("slider3").style.visibility="hidden";
            selectedID = -1;
        }
		else{
			selectedID = color[0];
            document.getElementById("slider1").style.visibility="visible";
            console.log(figure[selectedID].tx);
            document.getElementById("slide1").value=figure[selectedID].tx;
            document.getElementById("slider2").style.visibility="visible";
            console.log(figure[selectedID].ty);
            document.getElementById("slide2").value=figure[selectedID].ty;
            console.log(figure[selectedID].tz);
            document.getElementById("slider3").style.visibility="visible";
            document.getElementById("slide3").value=figure[selectedID].tz;
		}
		console.log("Selected: " + selectedID);
		
		//Cleanup
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		isDrawingOffScr = false
        gl.uniform1i(gl.getUniformLocation(program, "i"), -1);
        gl.clear( gl.COLOR_BUFFER_BIT );
        traverse(trunkId);
        for( let i = 0; i < forestNum; i++)
            forestTraverse(i, 0);
    });
   
    randomizeTree();

    render();
}

var render = function() {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        traverse(trunkId);
        for( let i = 0; i < forestNum; i++)
            forestTraverse(i, 0);
        requestAnimFrame(render);
}
