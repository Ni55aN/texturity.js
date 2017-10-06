export default {
    vertex: `
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
    fragment: `
        varying lowp vec2 coord;
        uniform mediump vec3 color1;
        uniform mediump vec3 color2;
        void main(void) {
            lowp float inten = sqrt(coord.x*coord.x+coord.y*coord.y);
            mediump vec3 color = color1 * inten + color2 * (1.0 - inten);
            gl_FragColor = vec4(color,1.0);
        }`
}
