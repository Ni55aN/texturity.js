import grayChunk from '../chunks/gray'

export default function (w, h, inverse) {
    
    var assign = `
    float gray = texture2D(texture, (coord+offset)/screen).r;

    real += gray * cos(-angle); 
    imag += gray * sin(-angle);
    `;
    var fragColor = `
    gl_FragColor = vec4(real,imag,magnitude(real,imag),1.0);
    `;

    var inverseAssign = `vec2 source = texture2D(texture, (coord+offset)/screen).rg;
    real += source.r * cos(angle) - source.g * sin(angle);
    imag += source.r * sin(angle) + source.g * cos(angle);`;
    var inverseFragColor = `
    real = real / screen.x / screen.y;
    gl_FragColor = vec4(vec3(real),1.0);`;

    return {
        vertex: `
        precision highp float;

        attribute vec2 position;
        uniform vec2 resolution;
        void main(void) {
            vec2 np = position/resolution;
            np.x=np.x*2.0-1.0;
            np.y=1.0-np.y*2.0;
            gl_Position = vec4(np, 0.0, 1.0);
        }`,
        fragment: `
        precision highp float;

        const int W = ${w};
        const int H = ${h};
        const float M_PI = 3.1415926535897932384626433832795;
        const vec2 screen = vec2(${w},${h});

        uniform sampler2D texture;
        uniform vec2 resolution;

        float magnitude(float real, float imag){
            return sqrt(real*real+imag*imag);
        }

        float phase(float real, float imag){
            return atan(real*real+imag*imag);
        }

        ${grayChunk()}
        
        void main(void) {
            float real = 0.0;
            float imag = 0.0;
            vec2 offset = vec2(0.5,0.5);
            float x = gl_FragCoord.x-offset.x;
            float y = gl_FragCoord.y-offset.y;

            for(int j = 0; j < H; j++)
                for(int i = 0; i < W; i++){
                    vec2 coord = vec2(float(i),float(j));
                    float angle = 2.0*M_PI*(x*coord.x/screen.x+y*coord.y/screen.y);
                    ${inverse ? inverseAssign : assign}
                }
                ${inverse ? inverseFragColor : fragColor}
            }`
    }
}