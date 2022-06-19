import paper from 'paper';
import type { Bounds, PaperCompoundPath, PaperPath, PaperScope } from './types';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import { PaperOffset } from './paper-offset';
import { pick } from 'lodash';
import { getRectRenderRadius, modelColorToPaperColor } from './utils';
import { IPathElementModel } from '@gaoding/editor-framework/src/types/editor';

export class PathRenderer {
    _paper: PaperScope;
    _model: IPathElementModel;

    private _canvas: HTMLCanvasElement;
    private _strokeBounds: Bounds;
    private _path?: PaperPath;
    private _offsetPath?: PaperCompoundPath;

    constructor(model: IPathElementModel, canvas?: HTMLCanvasElement) {
        if (!canvas) canvas = createCanvas(model.width, model.height);
        const _paper = new paper.PaperScope();
        _paper.setup(canvas);
        paper.settings.insertItems = false;
        _paper.view.autoUpdate = false;
        this._paper = _paper;
        this._model = model;
        this._canvas = canvas;
    }

    /**
     * 可视尺寸
     */
    get strokeBounds() {
        return this._strokeBounds;
    }

    get padding() {
        return 2;
    }

    get canvas() {
        const canvas = this._canvas;
        const scale = 1 / (window?.devicePixelRatio || 1);
        if (scale === 1) return this._canvas;
        const c = createCanvas(canvas.width * scale, canvas.height * scale) as HTMLCanvasElement;
        c.getContext('2d').drawImage(
            canvas,
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            c.width,
            c.height,
        );
        return c;
    }

    getStrokeBounds() {
        const { _model, _paper } = this;
        const strokeType = _model.$currentPathEffect.lineType;

        let _path = new _paper.Path(_model.path);
        if (_model.isRect())
            _path = _path
                .toShape(false)
                .set({ radius: getRectRenderRadius(_model) })
                .toPath(false);

        this._path = _path.set({
            fillColor: modelColorToPaperColor(_model),
            strokeWidth: _model.$currentPathEffect.width,
            strokeColor: _model.$currentPathEffect.color,
        });

        let strokeBounds = this._path.strokeBounds;
        if (strokeType !== 'center') {
            const offset =
                (_model.$currentPathEffect.width / 2) * (strokeType === 'inner' ? -1 : 1);
            this._offsetPath = PaperOffset.offset(this._path, offset, { insert: false });
            strokeBounds = this._offsetPath.strokeBounds;
        }

        return (this._strokeBounds = pick(strokeBounds, ['left', 'top', 'width', 'height']));
    }

    render(zoom = 1) {
        this._path = null;
        this._offsetPath = null;
        this._paper.view.scale((1 / this._paper.view.zoom) * zoom, new this._paper.Point(0, 0));
        this.alignCanvas(zoom);

        this._paper.project.activeLayer.removeChildren();
        const renderPath = this._offsetPath || this._path;
        this._paper.project.activeLayer.addChild(renderPath);

        this._paper.view.update();

        return this;
    }

    /**
     * canvas居中bbox
     * @param zoom;
     * @param padding canvas增加边距解决锯齿问题
     */
    private alignCanvas(zoom: number) {
        const { left, top, width, height } = this.getStrokeBounds();
        const padding = this.padding;
        this._paper.view.viewSize = new paper.Size(
            width * zoom + padding * 2,
            height * zoom + padding * 2,
        );
        const offsetLeft = left * zoom - 2;
        const offsetTop = top * zoom - 2;
        this._paper.view.matrix.tx = -offsetLeft;
        this._paper.view.matrix.ty = -offsetTop;
        if (!this._model.isLine()) {
            this._canvas.style.transform = `translate(${offsetLeft}px,${offsetTop}px)`;
        } else {
            this._canvas.style.transform = `translate(${-padding}px,${-padding}px)`;
        }
    }
}
