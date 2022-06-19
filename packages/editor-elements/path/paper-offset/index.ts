/**
 * copyright https://github.com/glenzli/paperjs-offset
 */

import paper from 'paper';
import { StrokeJoinType, PathType, StrokeCapType, offsetPath } from './core';

export interface OffsetOptions {
    join?: StrokeJoinType;
    cap?: StrokeCapType;
    limit?: number;
    insert?: boolean;
}

export class PaperOffset {
    public static offset(path: PathType, offset: number, options?: OffsetOptions): PathType {
        options = options || {};
        const newPath = offsetPath(path, offset, options.join || 'miter', options.limit || 10);
        if (options.insert === undefined) {
            options.insert = true;
        }
        if (options.insert) {
            (path.parent || paper.project.activeLayer).addChild(newPath);
        }
        return newPath;
    }
}
