import { Canvas } from '../canvas'

export default function(radius) {
    return Canvas.createShaderProgram(
        `
        attribute vec2 position;
        uniform vec2 resolution;
        varying mediump vec2 texcoord;
        void main(void) {
            texcoord = vec2((position.x+1.0)/2.0,(1.0-position.y)/2.0);
            gl_Position = vec4(position, 0.0, 1.0);
        }`,
        `#ifdef GL_ES
        precision highp float;
        #endif
        
        uniform vec2 resolution;
        varying mediump vec2 texcoord;
        uniform sampler2D texture;
        #define weight ${radius}

        void main(void) {
            vec4 sum = vec4(0.0);
            
            /// TODO 
            vec2 tc = texcoord;
            float blur = float(weight)/resolution.x; 
            
            float hstep = 1.0;
            float vstep = 1.0;
            
            sum += texture2D(texture, vec2(tc.x - 4.0*blur*hstep, tc.y + 4.0*blur*vstep)) * 0.0162162162;
            sum += texture2D(texture, vec2(tc.x - 3.0*blur*hstep, tc.y - 3.0*blur*vstep)) * 0.0540540541;
            sum += texture2D(texture, vec2(tc.x - 2.0*blur*hstep, tc.y + 2.0*blur*vstep)) * 0.1216216216;
            sum += texture2D(texture, vec2(tc.x - 1.0*blur*hstep, tc.y - 1.0*blur*vstep)) * 0.1945945946;
            
            sum += texture2D(texture, vec2(tc.x, tc.y)) * 0.2270270270;
            
            sum += texture2D(texture, vec2(tc.x + 1.0*blur*hstep, tc.y + 1.0*blur*vstep)) * 0.1945945946;
            sum += texture2D(texture, vec2(tc.x + 2.0*blur*hstep, tc.y - 2.0*blur*vstep)) * 0.1216216216;
            sum += texture2D(texture, vec2(tc.x + 3.0*blur*hstep, tc.y + 3.0*blur*vstep)) * 0.0540540541;
            sum += texture2D(texture, vec2(tc.x + 4.0*blur*hstep, tc.y - 4.0*blur*vstep)) * 0.0162162162;
        
            gl_FragColor =  vec4(sum.rgb, 1.0);
        }`
    )
}