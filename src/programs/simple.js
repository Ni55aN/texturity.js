import { Canvas } from '../canvas'

export default function() {
    return Canvas.createShaderProgram(
        `
        attribute vec2 position;
        uniform vec2 resolution;
        void main(void) {
            vec2 np = position/resolution;
            np.x=np.x*2.0-1.0;
            np.y=1.0-np.y*2.0;
            gl_Position = vec4(np, 0.0, 1.0);
        }`,

        `
        uniform mediump vec4 color;
        void main(void) {
            gl_FragColor = color;
        }`
    )
}