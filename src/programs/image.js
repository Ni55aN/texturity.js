import { Canvas } from '../canvas'

export default function() {
    return Canvas.createShaderProgram(
        `
    attribute vec2 position;
    attribute vec2 uv;
    uniform vec2 resolution;
    varying mediump vec2 texcoord;
    void main(void) {
        vec2 np = position/resolution;
        np.x=np.x*2.0-1.0;
        np.y=1.0-np.y*2.0;
        texcoord = uv;
        gl_Position = vec4(np, 0.0, 1.0);
    }`,
        `
    varying mediump vec2 texcoord;
    uniform sampler2D texture;
    void main(void) {
        gl_FragColor = vec4(texture2D(texture, texcoord).rgb,1.0);
    }`
    )
}