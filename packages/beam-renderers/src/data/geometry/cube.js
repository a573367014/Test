export function createCubeModel([lx = 1, ly = 1, lz = 1]) {
    return {
        data: {
            normal: [
                0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

                // Back face
                0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

                // Top face
                0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

                // Bottom face
                0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

                // Right face
                -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,

                // Left face
                -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            ],
            position: [
                -lx,
                -ly,
                lz,
                lx,
                -ly,
                lz,
                lx,
                ly,
                lz,
                -lx,
                ly,
                lz,

                // Back face
                -lx,
                -ly,
                -lz,
                -lx,
                ly,
                -lz,
                lx,
                ly,
                -lz,
                lx,
                -ly,
                -lz,

                // Top face
                -lx,
                ly,
                -lz,
                -lx,
                ly,
                lz,
                lx,
                ly,
                lz,
                lx,
                ly,
                -lz,

                // Bottom face
                -lx,
                -ly,
                -lz,
                lx,
                -ly,
                -lz,
                lx,
                -ly,
                lz,
                -lx,
                -ly,
                lz,

                // Right face
                lx,
                -ly,
                -lz,
                lx,
                ly,
                -lz,
                lx,
                ly,
                lz,
                lx,
                -ly,
                lz,

                // Left face
                -lx,
                -ly,
                -lz,
                -lx,
                -ly,
                lz,
                -lx,
                ly,
                lz,
                -lx,
                ly,
                -lz,
            ],
            texCoord: [
                0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1,
                1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0,
            ],
        },
        index: {
            array: [
                0,
                1,
                2,
                0,
                2,
                3, // Front
                4,
                5,
                6,
                4,
                6,
                7, // Back
                8,
                9,
                10,
                8,
                10,
                11, // Top
                12,
                13,
                14,
                12,
                14,
                15, // Bottom
                16,
                17,
                18,
                16,
                18,
                19, // Right
                20,
                21,
                22,
                20,
                22,
                23, // Left],
            ],
        },
    };
}
