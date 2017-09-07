import { Canvas } from '../canvas'

export default function() {
    return Canvas.createShaderProgram(`
    attribute vec2 position;
    varying mediump vec2 texcoord;
    void main(void) {
        texcoord = vec2((position.x+1.0)/2.0,(1.0-position.y)/2.0);
        gl_Position = vec4(position, 0.0, 1.0);
    }`,
        `
    uniform lowp vec2 resolution;
    varying mediump vec2 texcoord;
    uniform sampler2D texture;
    uniform mediump float scale;

    lowp float grey(vec3 color){
        return dot(color.rgb, vec3(0.299, 0.587, 0.114));
    }

    void main(void) {
        lowp float PIXEL_WIDTH = 1.0/resolution.x;
        lowp float PIXEL_HEIGHT = 1.0/resolution.y;
        lowp float c = grey(texture2D(texture, texcoord).rgb);
        lowp float cx = grey(texture2D(texture, texcoord+vec2(PIXEL_WIDTH, 0.0)).rgb);
        lowp float cy = grey(texture2D(texture, texcoord+vec2(0.0, PIXEL_HEIGHT)).rgb);


        lowp float dx = (c - cx) * scale;
        lowp float dy = (c - cy) * scale;
        lowp float nz = 1.0;
        lowp float len = sqrt(dx * dx + dy * dy + nz * nz);

        lowp float nx = dx / len;
        lowp float ny = -dy / len;
        nz = nz / len;

        lowp vec3 r = (vec3(nx, ny, nz)+1.0)/2.0;


        gl_FragColor = vec4(r,1.0);
        
    }`
    )
}