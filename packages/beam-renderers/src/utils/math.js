export function homoConvertToRect(vec4) {
    const out = [];
    out[0] = vec4[0] / vec4[3];
    out[1] = vec4[1] / vec4[3];
    out[2] = vec4[2] / vec4[3];
    return out;
}
export function multiplyVec3(matrix, vec3) {
    const out = [];
    out[0] = matrix[0] * vec3[0] + matrix[4] * vec3[1] + matrix[8] * vec3[2] + matrix[12];
    out[1] = matrix[1] * vec3[0] + matrix[5] * vec3[1] + matrix[9] * vec3[2] + matrix[13];
    out[2] = matrix[2] * vec3[0] + matrix[6] * vec3[1] + matrix[10] * vec3[2] + matrix[14];
    out[3] = matrix[3] * vec3[0] + matrix[7] * vec3[1] + matrix[11] * vec3[2] + matrix[15];
    return homoConvertToRect(out);
}
export function isPowerOf2(num) {
    return (num & (num - 1)) === 0;
}
