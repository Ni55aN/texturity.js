import colorModelsChunk from '../chunks/color-models';

export default function (b, expression, preExpressions = '') {
    return {
        vertex: `
        attribute vec2 position;
        varying mediump vec2 texcoord;
        void main(void) {
            texcoord = (position+1.0)/2.0;
            gl_Position = vec4(position, 0.0, 1.0);
        }
        `,
        fragment: `
        #ifdef GL_ES
        precision mediump float;
        #endif
        varying mediump vec2 texcoord;
        uniform sampler2D texture1;
        ${b instanceof WebGLTexture ?
        'uniform sampler2D texture2'
        : (b instanceof Array ?
            'uniform mediump vec3 color'
            : 'uniform mediump float value')};
        
        ${colorModelsChunk()}

        void main(void) {
            vec3 a = texture2D(texture1, texcoord).rgb;
            vec3 b = ${b instanceof WebGLTexture ?
        'texture2D(texture2, texcoord).rgb'
        : (b instanceof Array ?
            'color'
            : 'vec3(value)')};
            ${preExpressions}
            gl_FragColor = vec4(${expression}, 1.0);
        }`
    }
}