// xy 平面
export const FACE_XY = 0;

// xz 平面
export const FACE_XZ = 1;

export function angleToVec(angle, face = FACE_XY) {
    const radium = (angle) / 180 * Math.PI;
    return [
        face === FACE_XY ? Math.cos(radium) : Math.sin(radium),
        face === FACE_XY ? Math.sin(radium) : 0,
        face === FACE_XZ ? -Math.cos(radium) : 0,
    ];
}

export function vecToAngle(vec, face = FACE_XY) {
    const sy = face === FACE_XY ? vec[1] : vec[0];
    const sx = face === FACE_XY ? vec[0] : -vec[2];
    return Math.atan2(sy, sx) / Math.PI * 180;
}
