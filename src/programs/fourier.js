import { createShaderProgram } from '../canvas'

export default function (w, h, inverse) {

    var assign = `float gray = toGray(texture2D(texture, targetCoord).rgb);
    real += gray * cos(angle); 
    imag -= gray * sin(angle);`;
    var fragColor = `
    float sq = screen.x*screen.y;
    gl_FragColor = vec4(real/sq,imag/sq,magnitude(real,imag),1.0);
    `;

    var inverseAssign = `vec2 source = texture2D(texture, targetCoord).rg;
    real += source.r * cos(angle) - source.g * sin(angle);
    imag += source.r * sin(angle) + source.g * cos(angle);`;
    var inverseFragColor = `
    gl_FragColor = vec4(real,real,real,1.0);`;

    return createShaderProgram(
        `
    precision highp float;

    attribute vec2 position;
    uniform vec2 resolution;
    void main(void) {
        vec2 np = position/resolution;
        np.x=np.x*2.0-1.0;
        np.y=1.0-np.y*2.0;
        gl_Position = vec4(np, 0.0, 1.0);
    }`,
        `
    precision highp float;

    const int W = ${w};
    const int H = ${h};
    const float M_PI = 3.1415926535897932384626433832795;
    const vec2 screen = vec2(float(W),float(H));

    uniform sampler2D texture;
    uniform vec2 resolution;

    float magnitude(float real, float imag){
        return sqrt(real*real+imag*imag);
    }

    float phase(float real, float imag){
        return atan(real*real+imag*imag);
    }

    float toGray(vec3 c){
        return dot(c,vec3(0.299, 0.587, 0.114));
    }
    
    void main(void) {
        float real = 0.0;
        float imag = 0.0;
        vec2 destCoord = gl_FragCoord.xy${inverse?'':'-screen/2.0'};

        for(int y = 0; y < H; y++)
            for(int x = 0; x < W; x++){
                vec2 targetCoord = vec2(x,y)/screen;
                vec2 a = destCoord*vec2(x,y)/screen;
                float angle = 2.0*M_PI*(a.x+a.y);
                ${inverse ? inverseAssign : assign}
            }
            ${inverse ? inverseFragColor : fragColor}
        }`
    );
}