export class FloatFrameBuffer {
    
    constructor(gl, w, h) {
        this.gl = gl;
        this.w = w;
        this.h = h;

        this.framebuffer = this.initFB();
    }

    result() {
        var gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(this.framebuffer.buffer);

        return this.framebuffer.texture;
    }

    initFB() {
        var gl = this.gl;

        if (!(gl instanceof WebGL2RenderingContext)) throw new Error('Need webgl 2');
        //gl.getExtension('OES_texture_float_linear');
        var ext = gl.getExtension('EXT_color_buffer_float');
    
        if (!ext) 
            throw new Error('no EXT_color_buffer_float');
        
        var buffer = gl.createFramebuffer();
    
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    
        var texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, this.w, this.h, 0, gl.RGBA, gl.FLOAT, null);
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    
        if (status != gl.FRAMEBUFFER_COMPLETE) 
            alert('can not render to floating point textures');
        
        return { buffer, texture };
    }
}
