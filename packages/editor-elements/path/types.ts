export type PaperSegment = paper.Segment;
export type PaperScope = paper.PaperScope;
export type Point = paper.Point;
export type PaperPath = paper.Path;
export type PaperCompoundPath = paper.CompoundPath;

export interface PaperColor extends paper.Color {
    origin?: Point;
    destination?: Point;
}

export interface TransformDragInfo {
    dir: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'w' | 's' | 'e';
    width: number;
    height: number;
}

export interface Bounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ICreateShapeOptions {
    fillColor?: paper.Color;
    strokeColor?: paper.Color;
    strokeWidth?: number;
}
