export default {
    vertex: `
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
    fragment: `
        varying mediump vec2 texcoord;
        uniform sampler2D texture;
        void main(void) {
            gl_FragColor = vec4(texture2D(texture, texcoord).rgba);
        }`
}
