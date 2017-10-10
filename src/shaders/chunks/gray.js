export default function() {
    return `float gray(vec3 c){
        return dot(c,vec3(0.299, 0.587, 0.114));
    }`;
}