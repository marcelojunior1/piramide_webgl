window.onload = main;

// VARIAVEIS GLOBAIS
// CONSTANTES
const gFov = 25
const eye = vec3(3,3,3)
const at =  vec3(2,2,2)
const up =  vec3(1,1,4)
const near= 0.1;
const far = 100.0;

var gl;
var gCanvas;
var gShader = {};
var gCores = [];
var gBufferCor;
var gBufferVertices
var gIndiceBuffer
var programInfo;

var rotacao = 0.0;

var indices = [
    0,1,2,
    3,4,5,
    6,7,8,
    9,10,11,
    12,13,14, 12,13,17,
];

var cores_faces = [
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0],
];

var gPositions = [
    //Faces
    0.0, 0.0, 1.0,
    0.0, 1.0, 0.0,
    1.0, 0.0, 0.0,

    0.0, 0.0, 1.0,
    0.0, 1.0, 0.0,
    -1.0, 0.0, 0.0,

    0.0, 0.0, 1.0,
    -1.0, 0.0, 0.0,
    0.0, -1.0, 0.0,

    0.0, 0.0, 1.0,
    0.0, -1.0, 0.0,
    1.0, 0.0, 0.0,


    //Base
    -1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, -1.0, 0.0,

    -1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0
];

function main()
{
    // Inicia o canvas
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 não está disponível! ");


    inicia_shaders();

    var antes = 0;
    function render(agora)
    {
        agora /= 10000;
        const delta = agora - antes;
        antes = agora;
        desenhe(delta);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}


function desenhe(delta)
{
    // Limpa a tela
    gl.clearColor(0.1, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Matriz de pespectiva
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = perspective(gFov,aspect,near,far)

    // Matriz Model View
    var modelViewMatrix = lookAt(eye, at, up);

    // Leitura dos vertices
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, gBufferVertices);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    // Transformacoes

    //matriz_translacao = translate(-0.0, 0.0, -6.0)
    //modelViewMatrix = mult(modelViewMatrix, matriz_translacao)

    matriz_rotacao = rotate(rotacao, vec3(0, 0, 1))
    modelViewMatrix = mult(modelViewMatrix, matriz_rotacao)

    matriz_rotacao = rotate(rotacao, vec3(0, 1, 0))
    modelViewMatrix = mult(modelViewMatrix, matriz_rotacao)

    rotacao = (rotacao + delta*1000)%360

    // Leitura das cores
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, gBufferCor);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        flatten(projectionMatrix));

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        flatten(modelViewMatrix));

    {
        const vertexCount = indices.length;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

}

function inicia_shaders()
{
    // Cria o programa
    gShader.program = makeProgram(gl, gsVertexShaderSrc, gsFragmentShaderSrc);
    gl.useProgram(gShader.program);

    // Inicia o buffer de vertices na GPU
    gBufferVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gBufferVertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gPositions), gl.STATIC_DRAW);

    // Inicia as cores

    var colors = [];
    for (var j = 0; j < cores_faces.length; ++j)
    {
        const c = cores_faces[j];
        colors = colors.concat(c, c, c);
    }

    gBufferCor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gBufferCor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    var aColorLoc = gl.getAttribLocation(gShader.program, "aColor");
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColorLoc);
    gShader.uResolution = gl.getUniformLocation(gShader.program, "uResolution");

    // Indexando as faces
    gIndiceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gIndiceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Informacoes do programa
     programInfo = {
        program: gShader.program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(gShader.program, 'aPosition'),
            vertexColor: gl.getAttribLocation(gShader.program, 'aColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(gShader.program, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(gShader.program, 'uModelViewMatrix'),
        }
    };


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
    precision highp float;
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;