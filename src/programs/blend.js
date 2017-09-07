import { Canvas } from '../canvas'

export default function(a, b, expression) {
    return Canvas.createShaderProgram(
        `
        attribute vec2 position;
        varying mediump vec2 texcoord;
        void main(void) {
            texcoord = vec2((position.x+1.0)/2.0,(1.0-position.y)/2.0);
            gl_Position = vec4(position, 0.0, 1.0);
        }
        `,
        `
        #ifdef GL_ES
        precision mediump float;
        #endif
        varying mediump vec2 texcoord;
        uniform sampler2D texture1;
        ${b instanceof Canvas ?
        'uniform sampler2D texture2'
        : (b instanceof Array ?
            'uniform mediump vec3 color'
            : 'uniform mediump float value')};
        
        void main(void) {
            vec3 a = texture2D(texture1, texcoord).rgb;
            vec3 b = ${b instanceof Canvas ?
        'texture2D(texture2, texcoord).rgb'
        : (b instanceof Array ?
            'color'
            : 'vec3(value)')};
            gl_FragColor = vec4(${expression}, 1.0);
        }`
    );
}