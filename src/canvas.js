import BrickGenerator from './generators/brick';
import BlendProgram from './programs/blend';
import TransformGenerator from './generators/transform';
import BlurProgram from './programs/blur';
import CircleProgram from './programs/circle';
import RadialGradientProgram from './programs/radial-gradient';
import ImageProgram from './programs/image';
import NoiseProgram from './programs/noise';
import NormalProgram from './programs/normal';
import SimpleProgram from './programs/simple';

var gl = null;
var element = null;
var programs = null;
var vertexBuffer = null;

export class Canvas {

    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.img = null;
        gl = Canvas.initGL(w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    async save() {
        this.img = await this.toImage();
    }

    restore() {
        if (!this.img) throw 'nothing to restore';

        Canvas.resize(this.img.width, this.img.height);
        this.drawImage(this.img, 0, 0, this.img.width, this.img.height);
    
        return this;
    }
	
    drawBuffer(vertices) {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
        return this;
    }

    transform(image, tx, ty, repeat) {
        var generator = new TransformGenerator(tx, ty, repeat);

        var rects = generator.getRects(this.w, this.h);

        this.drawImage(image, rects);
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
        Canvas.useProgram(programs.radialGradient);
        gl.uniform3fv(gl.getUniformLocation(programs.radialGradient, 'color1'), color1);
        gl.uniform3fv(gl.getUniformLocation(programs.radialGradient, 'color2'), color2);
        this.drawRect(0, 0, this.w, this.h);
        Canvas.useProgram(programs.simple);
        
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
        Canvas.useProgram(programs.circle);
        gl.uniform1f(gl.getUniformLocation(programs.circle, 'r'), r);
        
        this.drawRect(0, 0, this.w, this.h);
        Canvas.useProgram(programs.simple);
        
        return this;
    }

    drawImage(img, x, y, w, h) {
        var drawArray = x instanceof Array;
			
        Canvas.useProgram(programs.image);
        var uvBuffer = gl.createBuffer();
        var uvs = [0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0];

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        var tex = Canvas.loadTexture(img);

        gl.bindTexture(gl.TEXTURE_2D, tex);
		
        if (drawArray)
            x.forEach(r => this.drawRect(...r));
        else
        	this.drawRect(x, y, w, h);
		
        gl.deleteBuffer(uvBuffer);
        Canvas.useProgram(programs.simple);

        return this;
    }

    fillStyle(color) {
        var colorLoc = gl.getUniformLocation(programs.simple, 'color');

        gl.uniform4fv(colorLoc, color);

        return this;
    }

    noise() {
        Canvas.useProgram(programs.noise);
        gl.uniform1f(gl.getUniformLocation(programs.noise, 'seed'), Math.random());

        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);

        Canvas.useProgram(programs.simple);

        return this;
    }
	
    blur(image, radius) {
        radius = Math.min(radius, 25);
        var blurProgram = BlurProgram(radius);

        Canvas.useProgram(blurProgram);
        var tex = Canvas.loadTexture(image);

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(gl.getUniformLocation(blurProgram, 'texture'), tex);

        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);

        Canvas.useProgram(programs.simple);

        return this;
    }

    blend(image, b, expression) {
        var a = image;
        
        var blendProgram = BlendProgram(a, b, expression);

        Canvas.useProgram(blendProgram);
        var tex1 = Canvas.loadTexture(a);

        if (b instanceof Canvas) {
            var tex2 = Canvas.loadTexture(b);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, tex2);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture1'), 0);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture2'), 1);
        } else if (b instanceof Array) {
            gl.bindTexture(gl.TEXTURE_2D, tex1);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture1'), 0);
            gl.uniform3fv(gl.getUniformLocation(blendProgram, 'color'), b);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, tex1);
            gl.uniform1i(gl.getUniformLocation(blendProgram, 'texture1'), 0);
            gl.uniform1f(gl.getUniformLocation(blendProgram, 'value'), b);
        }
        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);

        Canvas.useProgram(programs.simple);
        gl.deleteProgram(blendProgram);
        
        return this;
    }

    normalMap(image, scale) {
        Canvas.useProgram(programs.normal);
        gl.uniform1f(gl.getUniformLocation(programs.normal, 'scale'), scale);
        var tex = Canvas.loadTexture(image);

        gl.bindTexture(gl.TEXTURE_2D, tex);

        this.drawBuffer([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]);

        Canvas.useProgram(programs.simple);
        
        return this;
    }

    toSrc() {
        return element.toDataURL();
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

    takeGL(callback) {
        callback(gl);
    }

    static initialInit() {
        if (gl) return;

        element = document.createElement('canvas');
        gl = element.getContext('webgl');

        programs = {
            simple: SimpleProgram(),
            normal: NormalProgram(),
            circle: CircleProgram(),
            image: ImageProgram(),
            noise: NoiseProgram(),
            radialGradient: RadialGradientProgram()
        }

        Canvas.useProgram(programs.simple);

        vertexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        var posAttr = gl.getAttribLocation(programs.simple, 'position');

        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
    }

    static initGL(w, h) {
        this.initialInit();
        this.resize(w, h);
        return gl;
    }

    static resize(w, h) {
        element.width = w;
        element.height = h;

        gl.viewport(0, 0, element.width, element.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }

    static createShader(source, type) {
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

    static createShaderProgram(vert, frag) {
        var vertShader = this.createShader(vert, gl.VERTEX_SHADER);
        var fragShader = this.createShader(frag, gl.FRAGMENT_SHADER);
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

    static loadTexture(img) {
        if (!(img instanceof Image)) throw 'argument should be instance of Image';
        
        var tex = gl.createTexture();

        // console.log(img);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    }

    static useProgram(program) {
        gl.useProgram(program);
        var resolLoc = gl.getUniformLocation(program, 'resolution');

        gl.uniform2fv(resolLoc, [element.width, element.height]);
    }
}