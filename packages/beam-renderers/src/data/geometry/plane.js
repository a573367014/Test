export function createPlaneModel(
    [lx = 1, ly = 1],
    { division = 1, isSimple = false, direc = 'z' },
) {
    const position = [];
    const normal = [];
    const index = [];
    const texCoord = [];

    let i, j, k, x, y;
    for (i = 0; i <= division; i++) {
        for (j = 0; j <= division; j++) {
            x = -lx + (i / division) * 2 * lx;
            y = -ly + (j / division) * 2 * ly;
            switch (direc) {
                case 'x':
                    position.push(0, x, y);
                    normal.push(1, 0, 0);
                    break;
                case 'y':
                    position.push(x, 0, y);
                    normal.push(0, 1, 0);
                    break;
                default:
                    position.push(x, y, 0);
            }
            if (!isSimple) {
                texCoord.push(i / division, j / division);
            }
        }
    }
    for (i = 0; i < division; i++) {
        for (j = 0; j < division; j++) {
            k = (division + 1) * i + j;
            index.push(k, k + 1, k + division + 1, k + 1, k + division + 2, k + division + 1);
        }
    }
    if (isSimple) {
        return {
            data: { position },
            index: { array: index },
        };
    } else {
        return {
            data: { position, normal, texCoord },
            index: { array: index },
        };
    }
}
