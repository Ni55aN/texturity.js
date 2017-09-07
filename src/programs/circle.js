import { Canvas } from '../canvas'

export default function() {
    return Canvas.createShaderProgram(
        `
        attribute vec2 position;
        uniform vec2 resolution;
        varying lowp vec2 coord;
        void main(void) {
            vec2 np = position/resolution;
            np.x=np.x*2.0-1.0;
            np.y=1.0-np.y*2.0;
            coord = np;
            gl_Position = vec4(np, 0.0, 1.0);
        }`,

        `
        varying lowp vec2 coord;
        uniform mediump float r;
        void main(void) {
            lowp float inten = sqrt(coord.x*coord.x+coord.y*coord.y);
            lowp vec3 color = vec3(distance(coord,vec2(0.0,0.0))<r?1.0:0.0);
            gl_FragColor = vec4(color,1.0);
        }`
    )
}