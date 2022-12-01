
var canvas;
var gl;

var program;

var NumVertices  = 108;

var pointsArray = [];
var normalsArray = [];
var indices = [];
var ibufferSize;


var framebuffer;

var flag = false;

var color = new Uint8Array(4);

var vertices = [];

var vertices2 = [];

var lightPosition = vec4(-100.0,-100.0, -100.0, 0.0 );
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var matColor = vec4(0.55, 0.3, 0.012, 1.0);

var materialAmbient = matColor;//vec4( 1.0, 0.8, 0.0, 1.0 );
var materialDiffuse = matColor;//vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = matColor;//vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 1.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [0.0, 0.0, 0.0];//[45.0, 45.0, 45.0];

var thetaLoc;

var Index = 0;

/*
function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);
     normal = normalize(normal);

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
*/

function createTube(n, h){
	
	ibufferSize = 6 * n * h; //how many indices will be pushed for the polygon to the ibufffer
	
	for(var j = 0 ; j < h ; j++){
		for(var i = 0 ; i < n ; i++){
			vertices2.push(vec4(Math.cos(i * 2 * Math.PI / n), j - (h -1) / 2 ,Math.sin(i * 2 * Math.PI / n),1.0));
			
		}
	}
	vertices2.push(vec4(0.0, -(h - 1) / 2,0.0,1.0)); // root center
	vertices2.push(vec4(0.0, (h - 1) / 2 ,0.0,1.0)); // roof center
	var rootind = n * h;
	var roofind = rootind + 1;
	
	console.log(vertices2);
	
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
		console.log(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
	}
	
	
	
}




window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    var ctx = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
    gl.enable(gl.CULL_FACE); //makes sure back sides dont drawn
    


    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    //colorCube();
	
	createTube(12,4);
	
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
		
	var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
	
    thetaLoc = gl.getUniformLocation(program, "theta");
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

    projection = ortho(-2, 2, -2, 2, -100, 100);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular); 
    
    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag};
    
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


    canvas.addEventListener("mousedown", function(event){
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.clear( gl.COLOR_BUFFER_BIT);
        gl.uniform3fv(thetaLoc, theta);
        for(var i=0; i<6; i++) {
            gl.uniform1i(gl.getUniformLocation(program, "i"), i+1);
            gl.drawArrays( gl.TRIANGLES, 6*i, 6 );
        }
        var x = event.clientX;
        var y = canvas.height -event.clientY;
          
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

        if(color[0]==255)
        if(color[1]==255) console.log("front");
        else if(color[2]==255) console.log("back");
        else console.log("right");
        else if(color[1]==255)
        if(color[2]==255) console.log("left");
        else console.log("top");
        else if(color[2]==255) console.log("bottom");
        else console.log("background");
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.uniform1i(gl.getUniformLocation(program, "i"), 0);
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.uniform3fv(thetaLoc, theta);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

    }); 
          
    render();
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT );
    if(flag) theta[axis] += 2.0;
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.uniform1i(gl.getUniformLocation(program, "i"),0);
    gl.drawArrays( gl.TRIANGLES, 0, ibufferSize );
	//gl.drawElements( gl.TRIANGLES, ibufferSize, gl.UNSIGNED_BYTE, 0 );
	
    requestAnimFrame(render);
}
