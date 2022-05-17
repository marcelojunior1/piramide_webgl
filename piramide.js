window.onload = main;

// VARIAVEIS GLOBAIS
var gl;
var gCanvas;
var gShader = {};
var gCores = [];
var gBufferCor;

var gaPositions = [
    //Faces
    0,0,1,
    1,0,0,
    0,1,0,

    0,0,1,
    0,1,0,
    -1,0,0,

    0,0,1,
    -1,0,0,
    0,-1,0,

    0,0,1,
    0,-1,0,
    1,0,0,

    //Base
    0,-1,0,
    -1,0,0,
    1,0,0,

    0,1,0,
    1,0,0,
    -1,0,0
];

var cores_faces = [
    [1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, 1.0]
];

function main()
{
    // Inicia o canvas

    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 não está disponível! ");

    inicia_shaders();
    desenhe();
}


function desenhe()
{

}

function inicia_shaders()
{
    // Cria o programa
    gShader.program = makeProgram(gl, gsVertexShaderSrc, gsFragmentShaderSrc);
    gl.useProgram(gShader.program);

    // Inicia o buffer de vertices na GPU
    var bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gaPositions), gl.STATIC_DRAW);

    // Inicia as cores

    gBufferCor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gBufferCor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gCores), gl.STATIC_DRAW)
    var aColorLoc = gl.getAttribLocation(gShader.program, "aColor");
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColorLoc);
    gShader.uResolution = gl.getUniformLocation(gShader.program, "uResolution");
}

// --------------------------------------------------------------------------
// Código fonte dos shaders em GLSL

gsVertexShaderSrc = `
    attribute vec4 aPosition;
    attribute vec4 aColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
      vColor = aColor;
    }
  `;

gsFragmentShaderSrc = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;