import BrickGenerator from './generators/brick';
import BlendProgram from './programs/blend';
import ConvolutionProgram from './programs/convolution';
import FourierProgram from './programs/fourier';
import TransformGenerator from './generators/transform';
import BlurProgram from './programs/blur';
import CircleProgram from './programs/circle';
import RadialGradientProgram from './programs/radial-gradient';
import ImageProgram from './programs/image';
import NoiseProgram from './programs/noise';
import NormalProgram from './programs/normal';
import SimpleProgram from './programs/simple';
import {FloatFrameBuffer} from './utils/framebuffer';

var gl = null;
var element = null;
var programs = null;
var vertexBuffer = null;
var textures = [];
var format = null

export class Canvas {

    constructor(w, h, clearColor = [0.0, 0.0, 0.0, 1.0]) {
        this.w = w;
        this.h = h;
        this.backup = null;
        
        gl = initGL();
        gl.clearColor(...clearColor);
            
        resize(w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    save() {
        this.backup = {
            texture: this.toTexture(),
            width: element.width,
            height: element.height
        };
        return this;
    }

    restore() {
        if (!this.backup) throw 'nothing to restore';

        var w = this.backup.width;
        var h = this.backup.height;

        resize(w, h);
        this.drawTexture(this.backup.texture, 0, 0, w, h, true);

        this.backup = null;

        return this;
    }
	
    drawBuffer(vertices) {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
        return this;
    }

    transform(texture, tx, ty, repeat) {
        var generator = new TransformGenerator(tx, ty, repeat);

        var rects = generator.getRects(this.w, this.h);

        this.drawTexture(texture, rects);
        return this;
    }

    drawRect(x, y, w, h) {
        this.drawBuffer([x, y,
            x + w, y,
            x + w, y + h,
            x + w, y + h,
            x, y + h,
            x, y]);
        return this;
    }
	
    drawRadialGradient(color1, color2) {
        useProgram(programs.radialGradient);
        gl.uniform3fv(gl.getUniformLocation(programs.radialGradient, 'color1'), color1);
        gl.uniform3fv(gl.getUniformLocation(programs.radialGradient, 'color2'), color2);
        this.drawRect(0, 0, this.w, this.h);
        useProgram(programs.simple);
        
        return this;
    }

    drawBricks(count, margin) {
        this.fillStyle([0, 0, 0, 1]);
        this.drawRect(0, 0, this.w, this.h);
        this.fillStyle([1, 1, 1, 1]);

        var generator = new BrickGenerator(count, margin);
        var bricks = generator.getBricks(this.w, this.h);

        bricks.forEach(r => this.drawRect(...r));
        
        return this;
    }

    drawCircle(r) {
        useProgram(programs.circle);
        gl.uniform1f(gl.getUniformLocation(programs.circle, 'r'), r);
        
        this.drawRect(0, 0, this.w, this.h);
        useProgram(programs.simple);
        
        return this;
    }

    drawTexture(texture, x, y, w, h, params = [], uvs = null) {
        useProgram(programs.image);
        var uvBuffer = gl.createBuffer();

        uvs = uvs || [0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1];

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        params.forEach(param => {
            gl.texParameteri(gl.TEXTURE_2D, param[0], param[1]);
        });    

        if (x instanceof Array)
            x.forEach(r => this.drawRect(...r));
        else
        	this.drawRect(x, y, w, h);
        gl.disableVertexAttribArray(1);

        useProgram(programs.simple);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.deleteBuffer(uvBuffer);
  
        return this;
    }

    fillStyle(color) {
        var colorLoc = gl.getUniformLocation(programs.simple, 'color');

        gl.uniform4fv(colorLoc, color);

        return this;
    }

    noise() {
        useProgram(programs.noise);
        gl.uniform1f(gl.getUniformLocation(programs.noise, 'seed'), Math.random());

        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);

        useProgram(programs.simple);

        return this;
    }
	
    blur(texture, iterations) {
        iterations = Math.min(iterations, 100);
        var kernel = new Array(9).fill(1 / 9);
        var currentTexture = texture;

        for (var i = 0; i < iterations; i++) {
            this.convolution(currentTexture, kernel)
            this.disposeTexture(currentTexture)
            currentTexture = this.toTexture();
        }
        return this;
    }

    convolution(texture, matrix) {
        if (!(gl instanceof WebGL2RenderingContext)) throw new Error('Supported only in webgl 2');

        useProgram(programs.convolution);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(programs.convolution, 'texture'), texture);
        gl.uniform1fv(gl.getUniformLocation(programs.convolution, 'matrix'),
            new Float32Array(matrix));
        
        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);
        
        useProgram(programs.simple);
        return this;
    }

    blend(texture, b, expression) {
        var blendProgram = BlendProgram(b, expression);

        useProgram(blendProgram);
        
        if (b instanceof WebGLTexture) {
            var tex2 = b;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, tex2);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture1'), 0);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture2'), 1);
        } else if (b instanceof Array) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture1'), 0);
            gl.uniform3fv(gl.getUniformLocation(blendProgram, 'color'), b);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture1'), 0);
            gl.uniform1f(gl.getUniformLocation(blendProgram, 'value'), b);
        }
        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);

        useProgram(programs.simple);
        gl.activeTexture(gl.TEXTURE0);
        gl.deleteProgram(blendProgram);
        
        return this;
    }

    drawFourierSpectrum(texture) {
       
        this.blend(texture, element.width * element.height, 'vec3(a.z/sqrt(b+a.z*a.z))');
        var uv = 
        [
            -0.5, 0.5,
            0.5, 0.5,
            0.5, -0.5,
            
            0.5, -0.5,
            -0.5, -0.5,
            -0.5, 0.5
        ]
        var params = [[gl.TEXTURE_WRAP_T, gl.REPEAT], [gl.TEXTURE_WRAP_S, gl.REPEAT]];

        texture = this.toTexture();
        this.drawTexture(texture, 0, 0, element.width, element.height, params, uv)
        gl.deleteTexture(texture);

        return this;
    }

    fourierFilter(texture, mask) {
        var fb = new FloatFrameBuffer(gl, element.width, element.height);
        
        if (mask instanceof WebGLTexture) { /// shift mask
            var uv =
                    [
                        -0.5, 0.5,
                        0.5, 0.5,
                        0.5, -0.5,
            
                        0.5, -0.5,
                        -0.5, -0.5,
                        -0.5, 0.5
                    ]
            var params = [[gl.TEXTURE_WRAP_T, gl.REPEAT], [gl.TEXTURE_WRAP_S, gl.REPEAT]];

            this.drawTexture(mask, 0, 0, element.width, element.height, params, uv)
            gl.deleteTexture(mask);
            mask = this.toTexture();
        }

        this.blend(texture, mask, 'vec3(a.rg*b.r,a.b)');

        return fb.result();
    }

    fourierTransform(texture, inverse = false) {
        var fb = new FloatFrameBuffer(gl, element.width, element.height);
            
        var fourier = FourierProgram(this.w, this.h, inverse);

        useProgram(fourier);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        this.drawRect(0, 0, this.w, this.h);

        return fb.result();
    }

    normalMap(texture, scale) {
        useProgram(programs.normal);
        gl.uniform1f(gl.getUniformLocation(programs.normal, 'scale'), scale);

        gl.bindTexture(gl.TEXTURE_2D, texture);

        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);

        useProgram(programs.simple);
        
        return this;
    }

    disposeTexture(texture) {
        var index = textures.indexOf(texture);

        gl.deleteTexture(texture);
        textures.splice(index, 1);
    }

    toTexture() {
        var texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, element.width, element.height, 0, format, gl.UNSIGNED_BYTE, null);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, format, 0, 0, element.width, element.height, 0);

        textures.push(texture);
        return texture;
    }

    toSrc() {
        return element.toDataURL('image/png');
    }

    async toSrcAsync() {
        return new Promise(resolve => {
            element.toBlob((blob) => {
                resolve(URL.createObjectURL(blob))
            }, 'image/png');
        });    
    }
    
    async toImage() {
        var canv = this;

        return new Promise(function (resolve) {
            var img = new Image();

            img.onload = () => {
                resolve(img);
            };
            img.src = canv.toSrc();
        });
    }

    toImageSync() {
        var img = new Image();

        img.src = this.toSrc();
        return img;
    }
}

export function disposeTextures() {
    textures.forEach(t => gl.deleteTexture(t));
    textures = [];
}
export function getGL() {
    return gl;
}

export function initGL(contextName = 'webgl', params = {}) {
    if (gl) return gl;
  
    params = Object.assign({
        alpha: false,
        antialias: false,
        depth: false
    }, params);

    element = document.createElement('canvas');
    gl = element.getContext(contextName, params);
    format = params.alpha ? gl.RGBA : gl.RGB; 

    programs = {
        simple: SimpleProgram(),
        normal: NormalProgram(),
        convolution: ConvolutionProgram(),
        circle: CircleProgram(),
        image: ImageProgram(),
        noise: NoiseProgram(),
        radialGradient: RadialGradientProgram()
    }
    
    vertexBuffer = createBuffer();

    return gl;
}

export function createBuffer() {
    var buffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    
    var posAttr = gl.getAttribLocation(programs.simple, 'position');
    
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
    
    return buffer;
}

export function resize(w, h) {
    element.width = w;
    element.height = h;
    
    gl.viewport(0, 0, w, h);
    useProgram(programs.simple);
}

export function createShader(source, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!success)
        throw `could not compile 
                ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} 
                shader: ${gl.getShaderInfoLog(shader)}\n ${source}`;
    return shader;
}

export function createShaderProgram(vert, frag) {
    var vertShader = createShader(vert, gl.VERTEX_SHADER);
    var fragShader = createShader(frag, gl.FRAGMENT_SHADER);
    var shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.validateProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        var info = gl.getProgramInfoLog(shaderProgram);

        throw 'Could not compile WebGL program. \n\n' + info;
    }
    return shaderProgram;
}

export function loadTexture(img) {
    if (!(img instanceof Image)) throw 'argument should be instance of Image';
    
    var tex = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, img);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
}

export function useProgram(program) {
    gl.useProgram(program);
    var resolLoc = gl.getUniformLocation(program, 'resolution');

    gl.uniform2fv(resolLoc, [element.width, element.height]);
}