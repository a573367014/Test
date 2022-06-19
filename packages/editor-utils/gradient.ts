const { abs, PI, sin, cos } = Math;
export function getLinearGradientPoint(angle, width, height) {
    const ang = (90 - angle) * (PI / 180);
    // 渐变线长度
    const gradientLineLength = abs(width * sin(ang)) + abs(height * cos(ang));
    const center = {
        x: width / 2,
        y: height / 2,
    };
    const yDiff = (sin(ang - PI / 2) * gradientLineLength) / 2;
    const xDiff = (cos(ang - PI / 2) * gradientLineLength) / 2;
    return [center.x - xDiff, center.y - yDiff, center.x + xDiff, center.y + yDiff];
}
