var canvas;
var gl;

var numVertices  = 200000;

var nBuffer;
var vNormal;
var vBuffer;
var vPosition;

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
var modelView, projectionMatrix;
var rotationMatrix = mat4();
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var thetaLoc;

var flag = false;
var dragFlag = false;

var molluskType = 'turritella';
var count1 = 1;
var count2 = 1;
var a = 1.1;
var b = 3;
var c = 1;
var j = 2;
var k = 1;
var l = 1;
var m = 1;
var bigR = 2;
var r = 1;
var vIncrement = 0.1;
var uIncrement = 0.1;
var angleLimit = 6.28;



var cameraX;
var cameraY;
var cameraZ;
var cameraZoom = 20;
var cameraZoomMin = 10;
var cameraZoomMax = 50;

var xRotation = 0;
var yRotation = 0;


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
	
	vertices = [];
	pointsArray = [];
	normalsArray = [];
	
	vIncrement = 0.5 / count1;
	uIncrement = 0.5 / count2;
	
    switch(molluskType){
        case 'turritella':
            var v, u;
            for( v = 0.0; v < 2*angleLimit; v+=vIncrement ){
                for( u = 0.0; u < 2*angleLimit; u+=uIncrement ){
                    var curX = (bigR + r*Math.cos(v))*(Math.pow(a,u)*Math.cos(j*u));
                    var curY = (bigR + r*Math.cos(v))*((-Math.pow(a,u))*Math.sin(j*u));
                    var curZ = (-c)*(b + r*Math.sin(v))*(Math.pow(a,u)*k*Math.sin(v));
                    vertices.push(vec4(curX, curY, curZ, 1));
                }
            }
			
            numVertices = vertices.length;

            for(let i = 0; i < (vertices.length-4); i+=4){
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
                pointsArray.push(vertices[i]); 
                normalsArray.push(normal); 
                pointsArray.push(vertices[i+2]); 
                normalsArray.push(normal); 
                pointsArray.push(vertices[i+3]); 
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

function refreshMollusk(){
	generateMollusk();
	
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(normalsArray));

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(pointsArray));
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
	
	
    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    gl.bufferData( gl.ARRAY_BUFFER, 200000 * 8, gl.STATIC_DRAW );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(normalsArray));
	
	
    vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    gl.bufferData( gl.ARRAY_BUFFER, 200000 * 8, gl.STATIC_DRAW );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(pointsArray));
	
	
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    viewerPos = vec3(0.0, 0.0, -20.0 );
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
	

	document.getElementById("R-slider").value = bigR;
	document.getElementById("r-slider").value = r;
	document.getElementById("a-slider").value = a;
	document.getElementById("b-slider").value = b;
	document.getElementById("c-slider").value = c;
	document.getElementById("j-slider").value = j;
	document.getElementById("k-slider").value = k;
	document.getElementById("l-slider").value = l;
	document.getElementById("m-slider").value = m;
	document.getElementById("v-slider").value = count1;
	document.getElementById("u-slider").value = count2;

	document.getElementById("R-slider").onchange = function(){bigR = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("r-slider").onchange = function(){r = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("a-slider").onchange = function(){a = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("b-slider").onchange = function(){b = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("c-slider").onchange = function(){c = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("j-slider").onchange = function(){j = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("k-slider").onchange = function(){k = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("l-slider").onchange = function(){l = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("m-slider").onchange = function(){m = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("v-slider").onchange = function(){count1 = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("u-slider").onchange = function(){count2 = parseFloat(event.srcElement.value); refreshMollusk(); };
	

	canvas.addEventListener("wheel", function(event){
        cameraZoom += event.deltaY * 0.01;
        if(cameraZoom < cameraZoomMin)
            cameraZoom = cameraZoomMin;
        else if( cameraZoom > cameraZoomMax)
            cameraZoom = cameraZoomMax;
        projectionMatrix = ortho(-cameraZoom,cameraZoom, -cameraZoom * 0.3, cameraZoom * 1.7,-cameraZoom,cameraZoom);
	});
    canvas.addEventListener("mouseup", function(event){dragFlag = false;});
    canvas.addEventListener("mousedown", function(event){dragFlag = true;});
    canvas.addEventListener("mousemove", function(event){
        if(dragFlag){
            xRotation += event.movementX / Math.pow(cameraZoom, 0.5);
            yRotation += event.movementY / Math.pow(cameraZoom, 0.7);
            rotationMatrix = mat4();
            rotationMatrix = mult(rotationMatrix, rotate(xRotation, [0, 1, 0] ));
            rotationMatrix = mult(rotationMatrix, rotate(yRotation, [1, 0, 0] ));
        }
    });
    



	
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
    

    projectionMatrix = ortho(-cameraZoom,cameraZoom, -cameraZoom * 0.3, cameraZoom * 1.7,-cameraZoom,cameraZoom);

    
    render();
}


var render = function(){
            
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    if(flag) theta[axis] += 2.0;
            
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    modelView = mult( modelView, rotationMatrix);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projectionMatrix));
    
    gl.drawArrays( gl.LINES, 0, numVertices );
            
            
    requestAnimFrame(render);
}
