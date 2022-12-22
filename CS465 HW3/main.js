var canvas;
var gl;

var numVertices  = 200000;

var nBuffer;
var vNormal;
var vBuffer;
var vPosition;
var vColor;
var cBuffer;
var tBuffer;

var pointsArray = [];
var normalsArray = [];
var texCoordsArray = [];
var colorsArray = [];

var vertices = [];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 0.990, 0.426, 0.887, 1.0 ), // pink
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];    

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
var count1 = 2;
var count2 = 2;
var a = 1.1;
var b = 3;
var c = 1;
var j = 2;
var k = 1;
var l = 1;
var m = 1;
var bigR = 2;
var r = 1;
var vIncrement; //= 0.1;
var uIncrement; //= 0.1;
var angleLimit = 2 * Math.PI;

var vCount;
var uCount;

var cameraX;
var cameraY = -10;
var cameraZ;
var cameraZoom = 20;
var cameraZoomMin = 3;
var cameraZoomMax = 50;

var xRotation = 0;
var yRotation = 0;

var qeqe = 0.0;

var optionsTexture = false;
var optionsWireframe = true;

var texSize = 32;

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++) 
    for ( var f = 0; f < texSize; f++) 
       image1[i][f] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var f=0; f<texSize; f++) {
    var co = (((i & 0x8) == 0) ^ ((f & 0x8)  == 0));
    image1[i][f] = [co, co, co, 1];
}

var image2 = new Uint8Array(4*texSize*texSize);

    for ( var ii = 0; ii < texSize; ii++ ) 
        for ( var jj = 0; jj < texSize; jj++ ) 
           for(var kk =0; kk<4; kk++) 
                image2[4*texSize*ii+4*jj+kk] = 255*image1[ii][jj][kk];

function configureTexture(image) {
    texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, 
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}


function generateMollusk(){
	
	vertices = [];
	pointsArray = [];
	normalsArray = [];
    colorsArray = [];
    texCoordsArray = [];
	
	vIncrement = 1.0 / count1;
	uIncrement = 0.5 / count2;
	
    switch(molluskType){
        case 'turritella':
            var v, u;
            vCount = 0;
            uCount = 0;
            var uFlag = true;
            for( let u = 0.0; u < 0.9*angleLimit; u+=uIncrement ){
                for( let v = 0.0; v < 0.9*angleLimit; v+=vIncrement ){
                    var curX = (bigR + r*Math.cos(v))*(Math.pow(a,u)*Math.cos(j*u));
                    var curY = (bigR + r*Math.cos(v))*((-Math.pow(a,u))*Math.sin(j*u));
                    var curZ = (-c)*(b + r*Math.sin(v))*(Math.pow(a,u)*k*Math.sin(v));
                    vertices.push(vec4(curX, curY, curZ, 1));
                    if( uFlag )
                        vCount++;
                }
                //uCount = 0;
                uFlag = false;
                uCount++;
            }
			
            numVertices = vertices.length * 6;
            
			
            for(let i = 0; i < uCount-1; i++){
                for(let j = 0; j < vCount; j++){
                    var p1 = i*vCount+j;
                    var p2 = p1+1;
                    var p3 = (i+1)*vCount+j;
                    var p4 = p3+1;
                    
                    if( j == vCount-1){
                        p2 = (i+1)*vCount;
                        p4 = (i+2)*vCount;
                        if( i == uCount-2 ){
                            p2 -= vCount;
                            p4 -= vCount;
                        }
                    }

                    var t1 = subtract(vertices[p3], vertices[p1]);
                    var t2 = subtract(vertices[p2], vertices[p3]);
                    var normal = cross(t1, t2);
                    var normal = vec3(normal);

                    var thisColor = (j+i) % 2 == 0 ? vertexColors[2] : vertexColors[2];


                    pointsArray.push(vertices[p1]); 
                    normalsArray.push(normal); 
                    colorsArray.push(thisColor);
                    texCoordsArray.push(texCoord[0]);

                    pointsArray.push(vertices[p3]); 
                    normalsArray.push(normal);
                    colorsArray.push(thisColor);
                    texCoordsArray.push(texCoord[1]);

                    pointsArray.push(vertices[p2]); 
                    normalsArray.push(normal); 
                    colorsArray.push(thisColor);
                    texCoordsArray.push(texCoord[2]);

                    pointsArray.push(vertices[p3]); 
                    normalsArray.push(normal); 
                    colorsArray.push(thisColor);
                    texCoordsArray.push(texCoord[0]);

                    pointsArray.push(vertices[p2]); 
                    normalsArray.push(normal); 
                    colorsArray.push(thisColor);
                    texCoordsArray.push(texCoord[1]);

                    pointsArray.push(vertices[p4]); 
                    normalsArray.push(normal); 
                    colorsArray.push(thisColor);
                    texCoordsArray.push(texCoord[2]);

                }
            }
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

    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(colorsArray));
    
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(texCoordsArray));
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
    
    generateMollusk();
	
    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    gl.bufferData( gl.ARRAY_BUFFER, 200000 * 8, gl.STATIC_DRAW );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(colorsArray));

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
	
    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
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

    tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    gl.bufferData( gl.ARRAY_BUFFER, 200000 * 8, gl.STATIC_DRAW );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(texCoordsArray));
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture(image2);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
	document.getElementById("textureCheckbox").onchange = function() {
        optionsTexture = event.target.checked ? 1 : 0;
		gl.uniform1i(gl.getUniformLocation(program, "optionsTexture"), optionsTexture);
		gl.uniform1i(gl.getUniformLocation(program, "optionsTextureV"), optionsTexture);
    };
    document.getElementById("wireframeCheckbox").onchange = function() {
        optionsWireframe = event.target.checked ? 1 : 0;
		gl.uniform1i(gl.getUniformLocation(program, "optionsWireframe"), optionsWireframe);
		gl.uniform1i(gl.getUniformLocation(program, "optionsWireframeV"), optionsWireframe);
    };

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
	document.getElementById("l-slider").onchange = function(){l = parseFloat(event.srcElement.value); refreshMollusk(); qeqe += 0.1; };
	document.getElementById("m-slider").onchange = function(){m = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("v-slider").onchange = function(){count1 = parseFloat(event.srcElement.value); refreshMollusk(); };
	document.getElementById("u-slider").onchange = function(){count2 = parseFloat(event.srcElement.value); refreshMollusk(); };
	

	canvas.addEventListener("wheel", function(event){
        cameraZoom += event.deltaY * 0.01;
		//cameraZoom = min(max( cameraZoom , cameraZoomMin ), cameraZoomMax );
        if(cameraZoom < cameraZoomMin)
            cameraZoom = cameraZoomMin;
        else if( cameraZoom > cameraZoomMax)
            cameraZoom = cameraZoomMax;
        projectionMatrix = ortho(-cameraZoom,cameraZoom, -cameraZoom * 1.0, cameraZoom * 1.0,-cameraZoom,cameraZoom);
	});
    canvas.addEventListener("mouseup", function(event){dragFlag = false;});
	canvas.addEventListener("mouseleave", function(event){dragFlag = false;});
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
    

    projectionMatrix = ortho(-cameraZoom,cameraZoom, -cameraZoom * 1.0, cameraZoom * 1.0,-cameraZoom,cameraZoom);

    
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
    
    if( !optionsWireframe ){
        gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    }
    else{
        gl.drawArrays( gl.LINE_STRIP, 0, numVertices );
    }   
    requestAnimFrame(render);
}
