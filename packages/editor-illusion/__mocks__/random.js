export function randomNumber(min, max, format = (val) => val) {
    const ramdom = Math.random() * (max - min) + min;
    return format(ramdom);
}

export function randomVec3(min, max) {
    return {
        x: randomNumber(min, max),
        y: randomNumber(min, max),
        z: randomNumber(min, max)
    };
}
