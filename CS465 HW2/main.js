
var canvas;
var gl;
var program;

var projectionMatrix; 
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];


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

var numNodes = 4;
var angle = 0;

var theta = [0, 0, 0, 0];

var stack = [];

var figure = [];

//hierarchial nodes
var hNodes = [];


for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null, null, null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child, type, width, height, parent, id){
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
    }
    return node;
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

function initNodes(Id) {

        var m = mat4();
        
        switch(figure[Id].type) {
        
        case trunkId:
        
        m = rotate(theta[Id], 0, 1, 0 );
        figure[Id].transform = m;
        break;

        //unused
        case branch1Id:
        m = translate(0.0, trunkHeight+0.5*branchStdHeight, 0.0);
        m = mult(m, rotate(theta[Id], 1, 0, 0))
        m = mult(m, translate(0.0, -0.5*branchStdHeight, 0.0));
        figure[Id].transform = m;
        break;
        
        
        case b2uId:
        
        m = translate(0.0, figure[figure[Id].parent].height, 0.0);
        m = mult(m, rotate(0, 1, 0, 0));
        figure[Id].transform = m;
        break;
        
        case b2lId:

        m = translate(0.0, figure[figure[Id].parent].height, 0.0);
        m = mult(m, rotate(0, 1, 0, 0));
        figure[Id].transform = m;
        break;
    
    }
}


function randomizeTree() {

    //createNode(transform, render, sibling, child, type, width, height, parent)
    /*
        randomize trunk height and width
        anything branching from a base is:
        0.5 to 0.7 in width, 0.4 to 0.6 in height
    */

    var genQueue = [];
    
    numNodes = 0;
    trunkHeight = 10.0 + Math.random() * 2;
    trunkWidth = 1.0 + Math.random() * 0.5 ;
    //create Trunk
    //type0
    //0th
    var m = mat4();
    m = rotate(0, 0, 1, 0 );
    figure[numNodes] = createNode( m, trunk, null, null, 0, trunkWidth, trunkHeight, null, numNodes);
    genQueue.push(numNodes);
    numNodes++;

    /*
    //create at least one Standalone Branch
    //type3
    //1st
    m = mat4();
    m = translate(0.0, trunkHeight, 0.0);
    m = mult(m, rotate(randomAngle(), 1, 0, 0));
    figure[numNodes] = createNode( m, branchStd, numNodes+1, null, 3, trunkWidth*wDev(), trunkHeight*hDev());
    numNodes++;
    */

    /*
    //create at least one LVL1 Branch
    //type1
    //1st
    m = mat4();
    m = translate(0.0, trunkHeight, 0.0);
    m = mult(m, rotate(randomAngle(), 1, 0, 0));
    figure[numNodes] = createNode( m, branchLvl1, null, numNodes+1, 1, trunkWidth*wDev(), trunkHeight*hDev(), numNodes-1, numNodes);
    genStack.push(numNodes);
    numNodes++;

    //create at least one LVL2 Branch
    //type2
    //2nd
    m = mat4();
    m = translate(0.0, figure[numNodes-1].height, 0.0);
    m = mult(m, rotate(randomAngle(), 1, 0, 0));
    figure[numNodes] = createNode( m, branchLvl2, null, null, 2, figure[numNodes-1].width*wDev(), figure[numNodes-1].height*hDev(), numNodes-1, numNodes);
    genStack.push(numNodes);
    numNodes++;*/

    while( genQueue.length > 0 && numNodes < maxBranches ){
        var top = genQueue.shift();
        var parent = top;
        var mark1 = true;
        //2 to 5 branches from an existing branch
        var newBranchesCount = 2 + Math.floor(Math.random() * 4);
        for( let i = 0; i < newBranchesCount; i++ ){
            var m = mat4();
            m = figure[parent].type == 0 ? translate(0.0, figure[parent].height, 0.0) : translate(0.0, figure[parent].height * Math.random(), 0.0);
            m = mult(m, rotate(randomAngle(), 1, 0, 0));
            m = mult(m, rotate(randomAngle(), 0, 1, 0));
            m = mult(m, rotate(randomAngle(), 0, 0, 1));
            console.log(m);
            figure[numNodes] = createNode( m, branchLvl2, null, null, 2, figure[parent].width*wDev(), figure[parent].height*hDev(), parent, numNodes );
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

function traverse(Id) {
   if(Id == null) return; 
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render(Id);
   if(figure[Id].child != null) traverse(figure[Id].child); 
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling); 
}

/*
instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
*/

function trunk(Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function branchStd(Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function branchLvl1(Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function branchLvl2(Id) {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * figure[Id].height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( figure[Id].width, figure[Id].height, figure[Id].width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
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

    instanceMatrix = mat4();
    
    var zoom = 25.0;
    projectionMatrix = ortho(-zoom,zoom,-zoom, zoom,-zoom,zoom);
    modelViewMatrix = mat4();

        
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")
    
    cube();
        
    vBuffer = gl.createBuffer();
        
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    document.getElementById("slider0").onchange = function() {
        theta[trunkId ] = event.srcElement.value;
        initNodes(trunkId);
    };

    //for(i=0; i<numNodes; i++) initNodes(i);
    
    randomizeTree();

    render();
}


var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT );
        traverse(trunkId);
        requestAnimFrame(render);
}
