import { createShaderProgram } from '../canvas'

export default function () {
    return createShaderProgram(
        `#version 300 es

        precision mediump float;
        in vec2 position;
        uniform vec2 resolution;
        void main(void) {
            gl_Position = vec4(position, 0.0, 1.0);
        }
        `,
        `#version 300 es
        precision mediump float;

        uniform sampler2D tex;
        uniform vec2 resolution;
        uniform float matrix[9];

        void getDataMatrix(sampler2D t, vec2 c, out float arr[9]){
            int i=0;
            for(int x=-1;x<=1;x++)
                for(int y=-1;y<=1;y++){
                    vec2 offset = vec2(x,y)/resolution;
                    arr[i] = texture(t,c+offset).r;
                    i=i+1;
            }
        }

        out vec4 FragColor;

        void main(void) {
            vec2 texcoord = gl_FragCoord.xy/resolution;
            float arr[9];
            getDataMatrix(tex, texcoord, arr);
            float l = 0.0;
            for(int i=0;i<9;i++)
             l = l + arr[i]*matrix[i];

            FragColor = vec4(l,l,l, 1.0);
        }`
    );
}