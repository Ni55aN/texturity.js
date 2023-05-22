import blend from './shaders/runtime/blend';
import fourier from './shaders/runtime/fourier';
import neighbors from './shaders/runtime/neighbors';

import circle from './shaders/precompiled/circle';
import convolution from './shaders/precompiled/convolution';
import image from './shaders/precompiled/image';
import noise from './shaders/precompiled/noise';
import normal from './shaders/precompiled/normal';
import radialGradient from './shaders/precompiled/radial-gradient';
import simple from './shaders/precompiled/simple';

export default class {
    constructor(gl) {
        this.gl = gl;
        this.cache = new Map();

    }

    createPrecompiledShaders() {
        var precompiled = {
            simple,
            normal,
            convolution,
            circle,
            image,
            noise,
            radialGradient
        };

        Object.keys(precompiled).forEach(key => {
            var sources = precompiled[key];

            try {
                precompiled[key] = this.createShaderProgram(sources);
            } catch (e) {
                console.warn(e);
            }
        });
        return precompiled;
    }

    createShaderProgram(sources) {
        const hash = `${sources.vertex}_${sources.fragment}`

        if (this.cache.has(hash)) return this.cache.get(hash)

        var gl = this.gl;
        var vertShader = this.createShader(sources.vertex, gl.VERTEX_SHADER);
        var fragShader = this.createShader(sources.fragment, gl.FRAGMENT_SHADER);
        var shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);
        gl.validateProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(shaderProgram);

            throw new Error('Could not compile WebGL program. \n\n' + info);
        }
        this.cache.set(hash, shaderProgram)

        return shaderProgram;
    }

    createShader(source, type) {
        var gl = this.gl;
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

    createShaderRuntime(name, ...args) {
        if (name === 'blend')
            return this.createShaderProgram(blend(...args));

        if (name === 'fourier')
            return this.createShaderProgram(fourier(...args));

        if (name === 'neighbors')
            return this.createShaderProgram(neighbors(...args));

        throw new Error('Shader program not registered');
    }

    clear() {
        var gl = this.gl;

        for (const shaderProgram of this.cache.values()) {
            gl.deleteProgram(shaderProgram);
        }
    }
}
