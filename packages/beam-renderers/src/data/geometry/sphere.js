export function createSphereModel(SPHERE_DIV = 50, size = 1) {
    let i, ai, si, ci;
    let j, aj, sj, cj;
    let p1, p2;

    const position = [];
    const index = [];
    const texCoord = [];

    for (j = 0; j <= SPHERE_DIV; j++) {
        aj = (j * Math.PI) / SPHERE_DIV;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for (i = 0; i <= SPHERE_DIV; i++) {
            ai = (i * 2 * Math.PI) / SPHERE_DIV;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            position.push(size * si * sj, size * cj, size * ci * sj); // X
        }
    }

    for (j = 0; j < SPHERE_DIV; j++) {
        for (i = 0; i < SPHERE_DIV; i++) {
            p1 = j * (SPHERE_DIV + 1) + i;
            p2 = p1 + (SPHERE_DIV + 1);

            index.push(p1, p2, p1 + 1);
            index.push(p1 + 1, p2, p2 + 1);
        }
    }

    for (j = 0; j <= SPHERE_DIV; j++) {
        for (i = 0; i <= SPHERE_DIV; i++) {
            texCoord.push(i / SPHERE_DIV, 1 - j / SPHERE_DIV);
        }
    }

    return {
        data: { position, normal: position, texCoord },
        index: { array: index },
    };
}
