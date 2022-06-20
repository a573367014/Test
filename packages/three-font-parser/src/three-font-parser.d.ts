type Options = {
    size: Number,
    height: Number,
    steps: Number,
    curveSegments: Number,
    bevelEnabled: Boolean,
    bevelThickness: Number,
    bevelSize: Number,
    bevelSegments: Number,
    bevelType: 'quadEllipse' | 'halfEllipse' | 'line',
    extrudeOffsetX: Number,
    extrudeOffsetY: Number,
    extrudeScaleX: Number,
    extrudeScaleY: Number,
    laplacianIterationNumb: Number,
    shrink_factor: Number,
    enable_collision_detection: Boolean,
    scale: Number,
    tri_method: 'earcut' | 'poly2tri',
    horizon: Boolean,
    offsetScale: 1,
    shadingSmoothAngle: Number,
    worker: Boolean
}

type ModelInfo = {
    normals: Float32Array,
    texCoords: Float32Array,
    positions: Float32Array,
    indices: Float32Array,
}

type Model = {
    front: ModelInfo,
    side: ModelInfo,
    boundingBox: {
        min: [Number, Number, Number],
        max: [Number, Number, Number]
    },
}

export class Font {
	constructor( jsondata: any );
	data: string;
	generateShapes( text: string, size: number, divisions: number ): any[];
}

export function createTextModel(text: String, options: Options): Promise<Model>;

export function loadFont(url: String): Promise<Font>;

export function createFont(fontFile: ArrayBuffer): Promise<Font>;

declare module '@gaoding/three-font-parser';