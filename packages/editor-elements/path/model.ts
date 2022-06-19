import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { IPathEffect } from '@gaoding/editor-framework/src/types/editor';
import paper from 'paper';
import { ShapeType } from './path-editor/context';
import { isLinePath, isRectPath } from './path-editor/utils';

function _fillUpPathData(data) {
    if (!data.pathEffects) {
        data.pathEffects = [
            {
                type: 'brush',
                enable: true,
                lineType: 'inner',
                color: '#666666',
                width: 0,
            },
        ];
    }

    if (!data.pathEffects[0].filling) {
        // 兼容转换fillColor字段
        data.pathEffects[0].filling = {
            type: 'color',
            enable: true,
            color: data.pathEffects[0].fillColor || '',
        };
        data.pathEffects[0].fillColor = null;
    }
}

interface PathModel {
    path: string;
    pathEffects: IPathEffect[];
    radius: number;
    pathShape: string;
    $editing: boolean;
    $lookLike?: string;
}

class PathModel extends BaseModel {
    constructor(data) {
        _fillUpPathData(data);
        super(data);

        if (this.path) {
            this.$lookLike = this.lookLike();
        }
    }

    get $currentPathEffect() {
        return this.pathEffects[this.pathEffects.length - 1];
    }

    get $fillColor() {
        if (!this.$currentPathEffect.filling) return null;
        return this.$currentPathEffect.filling.gradient || this.$currentPathEffect.filling.color;
    }

    scaleElement(ratio = 1) {
        if (ratio === 1) return;
        this.$currentPathEffect.width = Math.round(this.$currentPathEffect.width * ratio);
        this.radius = Math.round(this.radius * ratio);
        const path = new paper.Path(this.path);
        path.scale(ratio, new paper.Point(0, 0));
        this.path = path.pathData;
    }

    getColors() {
        const colors = [];
        this.$currentPathEffect.color && colors.push(this.$currentPathEffect.color);
        this.$currentPathEffect.filling &&
            colors.push(
                this.$currentPathEffect.filling.gradient || this.$currentPathEffect.filling.color,
            );
        return colors;
    }

    lookLike(): ShapeType | undefined {
        if (!paper.project) {
            paper.setup(new paper.Size(1, 1));
            paper.settings.insertItems = false;
        }
        const path = new paper.Path(this.path);
        if (isRectPath(path)) return 'rect';
        if (isLinePath(path)) return 'line';
    }

    /**
     * 是否为直线
     */
    isLine() {
        return this.$lookLike === 'line';
    }

    /**
     * 是否为矩形
     */
    isRect() {
        return this.$lookLike === 'rect';
    }
}

export default PathModel;
