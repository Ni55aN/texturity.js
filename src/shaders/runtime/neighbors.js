export default function(expression) {
    return {
        vertex: `#version 300 es

        precision mediump float;
        in vec2 position;
        uniform vec2 resolution;
        void main(void) {
            gl_Position = vec4(position, 0.0, 1.0);
        }
        `,
        fragment: `#version 300 es
        precision mediump float;

        uniform sampler2D tex;
        uniform vec2 resolution;
        uniform float matrix[9];

        void getDataMatrix(sampler2D t, vec2 c, out vec3 arr[9]){
            int i=0;
            for(int x=-1;x<=1;x++)
                for(int y=-1;y<=1;y++){
                    vec2 offset = vec2(x,y)/resolution;
                    arr[i] = texture(t,c+offset).rgb;
                    i=i+1;
            }
        }

        out vec4 FragColor;

        void main(void) {
            vec2 texcoord = gl_FragCoord.xy/resolution;
            vec3 arr[9];
            getDataMatrix(tex, texcoord, arr);
            
            vec3 color = vec3(0.0);
            ${expression};
            FragColor = vec4(color, 1.0);
        }`
    }
}
