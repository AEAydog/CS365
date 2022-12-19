var canvas;
var gl;

var numVertices  = 36;

var count1, count2;

var pointsArray = [];
var normalsArray = [];

var vertices = [];

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var thetaLoc;

var flag = true;

var molluskType = 'turritella';
var a = 1.1;
var b = 3;
var c = 1;
var j = 2;
var k = 1;
var l = 1;
var m = 1;
var bigR = 2;
var r = 1;
var vIncrement = 1;
var uIncrement = 1;

var cameraX;
var cameraY;
var cameraZ;
var cameraZoom;

function quad(a, b, c, d) {

    var vertices2 = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 )
    ];

     var t1 = subtract(vertices2[b], vertices2[a]);
     var t2 = subtract(vertices2[c], vertices2[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);


     pointsArray.push(vertices2[a]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices2[b]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices2[c]); 
     normalsArray.push(normal);   
     pointsArray.push(vertices2[a]);  
     normalsArray.push(normal); 
     pointsArray.push(vertices2[c]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices2[d]); 
     normalsArray.push(normal);    
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function generateMollusk(){

    switch(molluskType){
        case 'turritella':
            var a = 1.1;
            var b = 3;
            var c = 1;
            var j = 2;
            var k = 1;
            var bigR = 2;
            var r = 1;
            var v, u;
            for( v = 0.0; v < 360; v+=vIncrement ){
                for( u = 0.0; u < 360; u+=uIncrement ){
                    var curX = (bigR + r*Math.cos(v))*(Math.pow(a,u)*Math.cos(j*u));
                    var curY = (bigR + r*Math.cos(v))*((-Math.pow(a,u))*Math.sin(j*u));
                    var curZ = (-c)*(b + r*Math.sin(v))*(Math.pow(a,u)*k*Math.sin(v));
                    vertices.push(vec4(curX, curY, curZ, 1));
                    //console.log("___________\nc:\n" + c)
                }
            }
            
            console.log(vertices);

            for(let i = 0; i < (vertices.length/4)-3; i++){
                var t1 = subtract(vertices[i+1], vertices[i]);
                var t2 = subtract(vertices[i+2], vertices[i+1]);
                var normal = cross(t1, t2);
                var normal = vec3(normal);
                pointsArray.push(vertices[i]); 
                normalsArray.push(normal); 
                pointsArray.push(vertices[i+1]); 
                normalsArray.push(normal); 
                pointsArray.push(vertices[i+2]); 
                normalsArray.push(normal); 
            }
            
            /*
            var t1 = subtract(vertices[b], vertices[a]);
            var t2 = subtract(vertices[c], vertices[b]);
            var normal = cross(t1, t2);
            var normal = vec3(normal);
    
    
            pointsArray.push(vertices[a]); 
            normalsArray.push(normal); 
            pointsArray.push(vertices[b]); 
            normalsArray.push(normal); 
            pointsArray.push(vertices[c]); 
            normalsArray.push(normal);   
            pointsArray.push(vertices[a]);  
            normalsArray.push(normal); 
            pointsArray.push(vertices[c]); 
            normalsArray.push(normal); 
            pointsArray.push(vertices[d]); 
            normalsArray.push(normal);
            */
        break;
        default:
        break;
    }

}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    //colorCube();
    generateMollusk();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

    projection = ortho(-1, 1, -1, 1, -100, 100);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
	
	
	
	document.getElementById("R-slider").onchange = function(){bigR = event.srcElement.value;};
	document.getElementById("r-slider").onchange = function(){r = event.srcElement.value;};
	document.getElementById("a-slider").onchange = function(){a = event.srcElement.value;};
	document.getElementById("b-slider").onchange = function(){b = event.srcElement.value;};
	document.getElementById("i-slider").onchange = function(){i = event.srcElement.value;};
	document.getElementById("j-slider").onchange = function(){j = event.srcElement.value;};
	document.getElementById("k-slider").onchange = function(){k = event.srcElement.value;};
	document.getElementById("c-slider").onchange = function(){c = event.srcElement.value;};
	document.getElementById("count1-slider").onchange = function(){count1 = event.srcElement.value;};
	document.getElementById("count2-slider").onchange = function(){count2 = event.srcElement.value;};
	
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
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
    
    render();
}

var render = function(){
            
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    if(flag) theta[axis] += 2.0;
            
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.drawArrays( gl.LINES, 0, numVertices );
            
            
    requestAnimFrame(render);
}
