import { AnchorType, PathEditorContext } from './path-editor/context';
import { BaseService } from '@gaoding/editor-framework/src/base/service';
import type {
    IPathEffect,
    IPathElementModel,
    IVPEditor,
} from '@gaoding/editor-framework/src/types/editor';
import paper from 'paper';
import PathModel from './model';
import { PathRenderer } from './path-renderer';
import {
    updateElementRectAtResize,
    resizeLine,
} from '@gaoding/editor-framework/src/utils/resize-element';
import type { PaperColor, TransformDragInfo } from './types';
import { colors } from './path-editor/consts';
import { debounce } from 'lodash';
import { modelColorToPaperColor } from './utils';
import { dataurlToBlob } from '@gaoding/editor-utils/binary';

interface IServiceStoreProps {
    fillColor: PaperColor;
    strokeColor: paper.Color;
    strokeWidth: number;
}

export class PathService extends BaseService {
    context: PathEditorContext;
    model: IPathElementModel;

    private _store: IServiceStoreProps = {
        fillColor: colors.defaultFill,
        strokeColor: colors.defaultStroke,
        strokeWidth: 0,
    };

    constructor(editor: IVPEditor) {
        super(editor);
        const canvas = document.createElement('canvas');
        canvas.classList.add('path-editor-canvas');
        canvas.tabIndex = -1;
        canvas.style.outline = 'none';
        this.context = new PathEditorContext(canvas, editor);
    }

    setStore<T extends keyof IServiceStoreProps>(key: T, value: IServiceStoreProps[T]) {
        this._store[key] = value;
    }

    private async _initEmptyEditing() {
        const { editor } = this;
        const pathProps = {
            type: 'path',
            left: 0,
            top: 0,
            width: editor.currentLayout.width,
            height: editor.currentLayout.height,
            path: '',
            radius: 0,
            $editing: true,
            pathShape: 'pen',
            $lookLike: this.context.state.toolType,
        } as IPathElementModel;

        this.model = new PathModel(pathProps) as unknown as IPathElementModel;
        this.model.$currentPathEffect.lineType = 'inner';
        editor.currentElement = this.model;
        await editor.$nextTick();
    }

    private readonly _debounceUpdateStore = debounce(
        (model: IPathElementModel, props: Partial<IPathEffect>) => {
            props.filling && (this._store.fillColor = modelColorToPaperColor(model));
            props.color && (this._store.strokeColor = new paper.Color(props.color));
        },
        500,
    );

    private _beforeInitEmptyEditing() {
        return new Promise((resolve) => {
            const { editor, context } = this;
            // 可在启动绘制时退出之前的编辑态
            if (editor.currentElement && editor.currentElement.$editing) {
                editor.currentElement.$editing = false;
                editor.$nextTick(() => {
                    resolve(true);
                });
            } else resolve(true);

            context.widgets.refreshShape(this.context, {
                fillColor: this._store.fillColor,
                strokeColor: this._store.strokeColor,
                strokeWidth: this._store.strokeWidth,
            });
        });
    }

    async initRectEditing() {
        await this._beforeInitEmptyEditing();
        this.context.setTool('rect');
        await this._initEmptyEditing();
        this.context.setCursor('rect');
    }

    async initEllipseEditing() {
        await this._beforeInitEmptyEditing();
        this.context.setTool('ellipse');
        await this._initEmptyEditing();
        this.context.setCursor('ellipse');
    }

    async initTriangleEditing() {
        await this._beforeInitEmptyEditing();
        this.context.setTool('triangle');
        await this._initEmptyEditing();
        this.context.setCursor('triangle');
    }

    async initLineEditing(width = 1) {
        this._store.strokeWidth = width;
        await this._beforeInitEmptyEditing();
        this.context.setTool('line');
        await this._initEmptyEditing();
        this._store.strokeWidth = 0;
        this.context.setCursor('line');
    }

    cancelEditing() {
        if (!this.model) return;
        this.model.$editing = false;
    }

    changeCurrentPathEffect(model: IPathElementModel, props: Partial<IPathEffect>) {
        Object.assign(model.$currentPathEffect, props);
        if (model.isLine() && props.width) {
            model.height = props.width;
        }

        this._debounceUpdateStore(model, props);

        this.editor.makeSnapshotByElement(model as IPathElementModel);
    }

    /**
     * 获取直线包围盒
     */
    getLineRect(model: IPathElementModel) {
        const path = new paper.Path(model.path);
        const p1 = path.firstSegment.point;
        const p2 = path.lastSegment.point;
        const size = p2.getDistance(p1);
        const angle = p2.subtract(p1).angle;
        return {
            left: p1.x,
            top: p1.y,
            width: size,
            height: Math.max(model.$currentPathEffect.width),
            angle,
        };
    }

    /**
     * 渲染 model 为 blob
     */
    renderToBlob(model: IPathElementModel): Promise<Blob> {
        const renderer = new PathRenderer(model).render();

        return new Promise((resolve, reject) => {
            try {
                renderer.canvas.toBlob(async (blob) => {
                    resolve(blob || dataurlToBlob(renderer.canvas.toDataURL()));
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async export(model: IPathElementModel) {
        if (!this.canEditPath(model)) return null;
        const renderer = new PathRenderer(model).render();
        const { canvas, strokeBounds } = renderer;
        // 2px padding
        return {
            canvas,
            offsetX: Math.round(-strokeBounds.left + renderer.padding),
            offsetY: Math.round(-strokeBounds.top + renderer.padding),
            elementRealWidth: strokeBounds.width + renderer.padding * 2,
            elementRealHeight: strokeBounds.height + renderer.padding * 2,
        };
    }

    resize(element: IPathElementModel, drag: TransformDragInfo) {
        const lastWidth = element.width;
        const lastHeight = element.height;
        const { dir } = drag;
        const path = new paper.Path(element.path);
        const strokeWidth = element.$currentPathEffect.width || 0;

        if (element.isLine()) {
            resizeLine.call(this.editor, element, drag);
            path.scale(element.width / lastWidth, 1, new paper.Point(0, element.height / 2));
            element.path = path.pathData;
        } else if (element.isRect()) {
            const { width, height } = updateElementRectAtResize(
                element,
                drag,
                Math.max(10, strokeWidth / 2),
            );
            const shape = new paper.Shape.Rectangle(new paper.Rectangle(0, 0, width, height));
            element.path = shape.toPath(false).pathData;
        } else {
            const { width, height } = updateElementRectAtResize(
                element,
                drag,
                Math.max(10, strokeWidth * 2),
            );
            const scaleX = width / lastWidth;
            const scaleY = height / lastHeight;

            /[e|w]/.test(dir) && path.scale(scaleX, 1, new paper.Point(0, height / 2));
            /[s|n]/.test(dir) && path.scale(1, scaleY, new paper.Point(width / 2, 0));
            element.path = path.pathData;
        }
        return element;
    }

    /**
     * 获取选中锚点类型
     */
    getPickedAnchorTypes() {
        return this.context.liteTool.getAnchorType();
    }

    getPickedAnchors() {
        return Array.from(this.context.currentPath.pickedAnchors);
    }

    setAnchorType(type: AnchorType) {
        this.context.liteTool.setAnchorType(type);
    }

    editPath(model: IPathElementModel) {
        if (this.editor.currentElement?.type !== 'path') return;
        this.context.setTool('lite');
        model.$editing = true;
    }

    /**
     * 判断是否可编辑
     */
    canEditPath(model: IPathElementModel) {
        return model.pathShape === 'pen';
    }
}
