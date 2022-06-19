import * as Y from '@gaoding/yjs';

export type YEventPath = (string | number)[];
export type YTemplet = Y.Map<unknown>;
export type YUrlMap = Y.Map<string>;
export type yFallbackMap = Y.Map<{
    url: string;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
}>;

export type YGlobal = Y.Map<unknown>;
export type YLayout = Y.Map<unknown>;
export type YElement = Y.Map<unknown>;
export type YTransform = Y.Map<unknown>;
export type YActionLogs = Y.Array<Y.Map<unknown>>;
