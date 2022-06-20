export function createCylinderModel({ radius = 1, div = 10, length = 10 }) {
    const position = [];
    const indexs = [];

    let angle, y, z;
    for (let i = 0; i < div; i++) {
        angle = (2 * i * Math.PI) / div;
        y = Math.sin(angle);
        z = Math.cos(angle);
        position.push(-length, radius * y, radius * z, length, radius * y, radius * z);
    }
    position.push(-length, 0, 0, length, 0, 0);

    for (let i = 0; i < div - 1; i++) {
        indexs.push(
            2 * i,
            2 * i + 2,
            2 * i + 1,
            2 * i + 1,
            2 * i + 2,
            2 * i + 3,
            2 * i,
            2 * i + 2,
            2 * div,
            2 * i + 1,
            2 * div + 1,
            2 * i + 3,
        );
    }
    indexs.push(
        2 * div - 2,
        0,
        2 * div - 1,
        2 * div - 1,
        0,
        1,
        2 * div - 2,
        0,
        2 * div,
        2 * div - 1,
        2 * div + 1,
        1,
    );

    return {
        data: { position },
        index: { array: indexs },
    };
}
