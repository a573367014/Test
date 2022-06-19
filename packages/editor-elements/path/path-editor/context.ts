import paper from 'paper';
import type {
    IPathElementModel,
    IPathStrokeType,
    IVPEditor,
} from '@gaoding/editor-framework/src/types/editor';
import { initEvents, CanvasEvent, initKeyEvents } from './events';
import {
    Widgets,
    EditableAnchor,
    EditablePath,
    CurveTarget,
    AnchorTarget,
    HandleTarget,
    PathTarget,
} from './widgets';
import {
    initPaper,
    loadModel,
    cloneWithReplace,
    testCurveDrag,
    refreshPickerFrame,
    beforeRenderHoverCurve,
    beforeRenderAnchor,
    afterRenderAnchor,
    createPoint,
    exportModel,
    updateShape,
    addShape,
    testAnchorMousedown,
    testHandleDrag,
    testPreAddPoint,
    insertAnchor,
    testAnchorHover,
    testHandleHover,
    resetSnapGuides,
    createSegment,
    beforeRenderMain,
    loadStyle,
    tryMergeAnchors,
    getAnchorType,
    isCloseEnough,
    trySwitchAnchorType,
    beforeRenderHandle,
    testPathDrag,
} from './utils';
import type { PaperScope, PaperSegment } from '../types';
import { mitt } from '../mitt';
import { cursors } from './consts';

export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'line';
type ToolType = 'pen' | 'lite' | ShapeType;
export type AnchorType = 'sharp' | 'fullMirror' | 'angleMirror' | 'noMirror';

class EnvState {
    context: PathEditorContext;
    toolType: ToolType = 'lite';
    mouseInCanvas = false;
    usePenCursor = false;
    dragging = false;
    dragTarget: CurveTarget | AnchorTarget | HandleTarget | PathTarget = null;
    hoverTarget: AnchorTarget | HandleTarget = null;

    constructor(context: PathEditorContext) {
        this.context = context;
    }

    get isPenTool() {
        return this.toolType === 'pen';
    }

    get isLiteTool() {
        return this.toolType === 'lite';
    }

    get isRectTool() {
        return this.toolType === 'rect';
    }

    get isEllipseTool() {
        return this.toolType === 'ellipse';
    }

    get isTriangleTool() {
        return this.toolType === 'triangle';
    }

    get isLineTool() {
        return this.toolType === 'line';
    }

    get isShapeTool() {
        return this.isRectTool || this.isEllipseTool || this.isTriangleTool || this.isLineTool;
    }

    get isDraggingAnchor() {
        return this.dragTarget instanceof AnchorTarget;
    }

    get isDraggingHandle() {
        return this.dragTarget instanceof HandleTarget;
    }

    get isDraggingPath() {
        return this.dragTarget instanceof PathTarget;
    }

    get isDragging() {
        return this.isDraggingAnchor || this.isDraggingHandle || this.isDraggingPath;
    }

    get isRangePicking() {
        return !this.isDraggingAnchor && !this.isDraggingHandle && !this.isDraggingPath;
    }
}

class BaseTool {
    context: PathEditorContext;
    widgets: Widgets;

    constructor(context: PathEditorContext) {
        this.context = context;
        this.widgets = context.widgets;
    }
}

class PenTool extends BaseTool {
    refreshCursorWidgets(e: CanvasEvent) {
        const { context, widgets } = this;
        const { currentPath, modelScale } = context;
        const { cursorPath, cursorPoint } = widgets;
        const { lastAnchor } = currentPath;
        const mousePoint = createPoint(e.x, e.y, modelScale);
        cursorPoint.position = mousePoint;

        if (lastAnchor) {
            const path = new paper.Path();
            path.add(currentPath.main.lastSegment);
            path.add(mousePoint);
            widgets.cursorPath = cloneWithReplace(path, cursorPath);
            lastAnchor.setHandleOut(path.firstSegment.handleOut);
        }
    }

    addAnchor(path: EditablePath, segment: PaperSegment) {
        const anchor = new EditableAnchor(segment);
        path.addAnchor(anchor);
    }

    bendSegment(e: CanvasEvent) {
        const { lastAnchor, main, hint } = this.context.currentPath;
        const delta = createPoint(e.delta.x, e.delta.y, this.context.modelScale);

        main.lastSegment.handleOut = main.lastSegment.handleOut.add(delta);
        hint.lastSegment.handleOut = hint.lastSegment.handleOut.add(delta);
        main.lastSegment.handleIn = main.lastSegment.handleIn.subtract(delta);
        hint.lastSegment.handleIn = hint.lastSegment.handleIn.subtract(delta);

        const { handleIn, handleOut } = main.lastSegment;
        lastAnchor.setHandleIn(handleIn);
        lastAnchor.setHandleOut(handleOut);
    }
}

class LiteTool extends BaseTool {
    private _testDragTarget(e: CanvasEvent, isDrag: boolean) {
        const { context } = this;

        // 直接拖拽新锚点
        if (this.addPreAnchor()) {
            context.currentPath.clearPickedAnchor();
        }

        if (testAnchorMousedown(context, e, isDrag)) return;
        if (testHandleDrag(context, e)) return;
        if (testCurveDrag(context, e)) return;
        testPathDrag(context, e);

        context.currentPath.clearPickedAnchor();
    }

    private _clearTarget() {
        this.context.state.dragTarget = null;
        this.context.currentPath.clearPickedAnchor();
    }

    setAnchorType(type: AnchorType, pickedAnchors: Set<number> = null) {
        const res = this.context.currentPath.setAnchorType(type, pickedAnchors);
        if (res) {
            this.context.events.emit('anchorTypeChange', this.getAnchorType());
        }
    }

    getAnchorType(): AnchorType[] {
        const { anchors, pickedAnchors } = this.context.currentPath;
        const result = [];
        if (pickedAnchors.size) {
            pickedAnchors.forEach((i) => {
                result.push(getAnchorType(anchors[i]));
            });
        }
        return result;
    }

    removeAnchor() {
        const { context } = this;
        const { currentPath, editor } = context;
        const { pickedAnchors } = currentPath;

        if (!pickedAnchors.size) return (editor.currentElement.$editing = false);

        for (let i = currentPath.anchors.length; i >= 0; i--) {
            const anchor = currentPath.anchors[i];
            if (pickedAnchors.has(i)) {
                currentPath.main.removeSegment(i);
                currentPath.hint.removeSegment(i);
                anchor.remove();
            }
        }

        currentPath.anchors = currentPath.anchors.filter((_, i) => !pickedAnchors.has(i));
        context.currentPath.clearPickedAnchor();

        if (!currentPath.anchors.length) {
            return editor.removeElement(editor.currentElement);
        }

        context.render();
    }

    onDragStart(e: CanvasEvent) {
        this._testDragTarget(e, true);
        // console.log(e); // 可供本地测试时记录拖拽起始点
    }

    onDragMove(e: CanvasEvent) {
        const { state, currentPath, modelScale } = this.context;

        // 原有参考线入口，未适配 zoom
        // if (state.isDraggingAnchor) refreshSnapGuides(this.context, e);
        // const lastX = e.x - e.delta.x;
        // const lastY = e.y - e.delta.y;
        // const [lastSnap] = getSnap(this.context, lastX, lastY);
        // const [newSnap] = getSnap(this.context, e.x, e.y);
        // console.log('e', e.x, e.y, 'last', lastX, lastY, 'snap', newSnap);
        // const snapDelta = createPoint(newSnap.x - lastSnap.x, newSnap.y - lastSnap.y);
        // if (state.isDraggingAnchor) currentPath.movePickedAnchors(snapDelta);

        const delta = createPoint(e.delta.x, e.delta.y, modelScale);

        // 按住 command 的拖拽行为
        if (e.keys.cmd) {
            if (state.isDraggingAnchor || state.isDraggingHandle) {
                currentPath.moveHandle(delta);
            }
        }
        // 按住 alt 的拖拽行为
        else if (e.keys.alt) {
            if (state.isDraggingHandle) {
                currentPath.moveHandle(delta);
            }
        }
        // 朴素的拖拽行为
        else {
            if (state.isDraggingAnchor) currentPath.movePickedAnchors(delta);
            else if (state.isDraggingHandle) currentPath.moveHandle(delta);
            else if (state.isDraggingPath) currentPath.move(delta);
            else if (state.isRangePicking) refreshPickerFrame(this.context, e);
        }
    }

    onDragEnd(e: CanvasEvent) {
        // console.log(e); // 可供本地测试时记录拖拽结束点
        const { context, widgets } = this;
        // const [snap] = getSnap(context, e.x, e.y);
        const point = createPoint(e.x, e.y, this.context.modelScale);
        if (context.state.isRangePicking) widgets.pickerFrame.visible = false;

        resetSnapGuides(context);
        tryMergeAnchors(context, point);

        if (context.currentPath.anchors.length <= 1) {
            context.editor.removeElement(context.editor.currentElement);
            return;
        } else if (context.state.isDragging) {
            context.undoManager.makeSnapshot();
        }

        context.state.dragTarget = null;
    }

    onHover(e: CanvasEvent) {
        if (this.context.state.isShapeTool) return;

        this.context.widgets.centerPreAddPoint.visible = false;
        const point = createPoint(e.x, e.y, this.context.modelScale);
        let cursor = 'default';
        const isKeyAction = e.keys.cmd || e.keys.alt;
        if (testAnchorHover(this.context, point))
            return this.context.setCursor(isKeyAction ? cursors.updateAnchor : '');
        testHandleHover(this.context, point) && isKeyAction && (cursor = cursors.updateAnchor);
        if (testPreAddPoint(this.context, point)) return this.context.setCursor(cursors.addAnchor);
        this.context.setCursor(cursor);
    }

    onClick(e: CanvasEvent) {
        this._clearTarget();

        const point = createPoint(e.x, e.y, this.context.modelScale);
        const { context, widgets } = this;

        // 单击 hover 预添加锚点
        if (this.addPreAnchor()) return;
        // 单击 center 预添加锚点
        else if (isCloseEnough(widgets.centerPreAddPoint.position, point, 6 * context.modelScale)) {
            insertAnchor(context, widgets.centerPreAddPoint.position);
            context.undoManager.makeSnapshot();
            return;
        }

        // 单击锚点或控制点
        this._testDragTarget(e, false);

        // 按住 command 单击锚点时，切换锚点状态
        if (context.state.isDraggingAnchor && e.keys.cmd) {
            trySwitchAnchorType(this.context, point);
            context.undoManager.makeSnapshot();
            return;
        }

        // 单击空白位置时返回展示态
        if (
            !context.state.isDragging &&
            !this.context.scene.hitTest(createPoint(e.x, e.y, this.context.modelScale))
        ) {
            context.editor.currentElement.$editing = false;
        }

        context.render();
    }

    onDblClick(e: CanvasEvent) {
        const point = createPoint(e.x, e.y, this.context.modelScale);
        trySwitchAnchorType(this.context, point);
        this.context.undoManager.makeSnapshot();
        this.context.render();
    }

    // 预添加锚点
    private addPreAnchor() {
        const { context } = this;
        const widgets = context.widgets;
        if (widgets.hoverPreAddPoint.visible) {
            insertAnchor(context, widgets.hoverPreAddPoint.position);
            context.undoManager.makeSnapshot();
            return true;
        }
        return false;
    }
}

class ShapeTool extends BaseTool {
    addShape(e: CanvasEvent) {
        addShape(this.context, e);
    }

    onDragStart(e: CanvasEvent) {
        updateShape(this.context, e);
    }

    onDragMove(e: CanvasEvent) {
        this.context.editor.$events.$emit('path.dragMove', e);
        updateShape(this.context, e);
    }

    onDragEnd(_e: CanvasEvent) {
        this.context.editor.currentElement.$editing = false;
        this.context.editor.$events.$emit('path.dragEnd');
    }
}

class SimpleUndoManager {
    context: PathEditorContext;
    private _states: string[] = [];
    private _index = -1;

    constructor(context: PathEditorContext) {
        this.context = context;
    }

    get model() {
        return this.context.editor.currentElement as IPathElementModel;
    }

    private get _indexAtLast() {
        return this._index === this._states.length - 1;
    }

    private get _current() {
        return this._states[this._index];
    }

    get hasUndo() {
        return this._index > 0;
    }

    get hasRedo() {
        return !this._indexAtLast;
    }

    makeSnapshot() {
        this.context.currentPath.main.translate(createPoint(-this.model.left, -this.model.top));
        const pathElement = this.context.currentPath.main.exportSVG() as SVGElement;
        const path = pathElement.getAttribute('d');
        this.context.currentPath.main.translate(createPoint(this.model.left, this.model.top));

        if (!this._indexAtLast) {
            this._states.splice(this._index + 1);
        }
        this._states.push(path);
        this._index = this._states.length - 1;
    }

    undo() {
        if (!this.hasUndo) return;
        this._index--;

        this.model.path = this._current;
        this.context.loadModel();
    }

    redo() {
        if (!this.hasRedo) return;
        this._index++;

        this.model.path = this._current;
        this.context.loadModel();
    }
}

export class PathEditorContext {
    editor: IVPEditor;
    canvas: HTMLCanvasElement;
    view: paper.View;

    penTool: PenTool;
    liteTool: LiteTool;
    shapeTool: ShapeTool;

    widgets: Widgets;
    state: EnvState;
    paths: EditablePath[] = [];
    undoManager = new SimpleUndoManager(this);

    strokeType: IPathStrokeType;
    events = mitt();
    private _pathIndex = 0;
    private _paper: PaperScope;

    constructor(canvas: HTMLCanvasElement, editor: IVPEditor) {
        this.editor = editor;
        this.canvas = canvas;

        const paper = initPaper(canvas);
        this._paper = paper;
        this.view = paper.view;
        this._initEventHandlers();

        this.state = new EnvState(this);
        this.widgets = new Widgets(this);
        this.penTool = new PenTool(this);
        this.liteTool = new LiteTool(this);
        this.shapeTool = new ShapeTool(this);
        this.paths = [new EditablePath(this)];

        this.syncSize();
        // @ts-ignore debug
        window.pathContext = this;
    }

    get scene() {
        return this._paper.project.activeLayer;
    }

    get width() {
        return this.editor.currentLayout?.width * this.zoom || 0;
    }

    get height() {
        return this.editor.currentLayout?.height * this.zoom || 0;
    }

    get currentPath() {
        return this.paths[this._pathIndex];
    }

    get zoom() {
        return this.editor.zoom;
    }

    get model() {
        return this.editor.currentElement as IPathElementModel;
    }

    /**
     * 将像素尺寸转为 model 尺寸时的缩放系数。
     * 如 zoom 为 2 时画布坐标系下 100 的距离，即可换算为 50 的 model 坐标系长度。
     * 亦可用于保证控件尺寸不随 zoom 变动。
     */
    get modelScale() {
        return 1 / this.zoom;
    }

    loadModel() {
        const { model, widgets } = this;
        if (model.path === '') return this.resetPaths();
        loadModel(this, model);
        widgets.centerPreAddPoint.visible = false;
        widgets.hoverPreAddPoint.visible = false;
        this.fitZoom();
        this.render();
    }

    loadStyle(model: IPathElementModel) {
        loadStyle(this, model);
        this.render();
    }

    exportModel() {
        exportModel(this, this.model);
        this.currentPath.remove();
        return this.model?.path; // 仅供控制台调试用
    }

    setTool(toolType: ToolType) {
        const { state } = this;
        state.toolType = toolType;

        if (state.isLiteTool) state.dragTarget = null;

        this.render();
    }

    syncSize(update = true) {
        this.view.viewSize = new paper.Size(this.width, this.height);
        update && this.render();
    }

    fitZoom() {
        this.syncSize(false);
        this.view.scale((1 / this.view.zoom) * this.zoom, { x: 0, y: 0 } as paper.Point);
        this.render();
    }

    private _onDragStart = (e: CanvasEvent) => {
        const { state, penTool, liteTool, shapeTool, currentPath } = this;
        state.dragging = true;

        if (state.isPenTool) penTool.addAnchor(currentPath, createSegment(e.x, e.y));
        else if (state.isLiteTool) liteTool.onDragStart(e);
        else if (state.isShapeTool) shapeTool.onDragStart(e);

        this.render();
    };

    private _onDragMove = (e: CanvasEvent) => {
        const { state, penTool, liteTool, shapeTool } = this;
        if (state.isPenTool) penTool.bendSegment(e);
        else if (state.isLiteTool) liteTool.onDragMove(e);
        else if (state.isShapeTool) shapeTool.onDragMove(e);

        this.render();
    };

    private _onDragEnd = (e: CanvasEvent) => {
        const { state, shapeTool } = this;
        state.dragging = false;

        if (state.isShapeTool) shapeTool.onDragEnd(e);
        else if (state.isLiteTool) this.liteTool.onDragEnd(e);

        this.render();
    };

    private _onClick = (e: CanvasEvent) => {
        const { state, penTool, liteTool, shapeTool, currentPath } = this;

        if (state.isPenTool) penTool.addAnchor(currentPath, createSegment(e.x, e.y));
        else if (state.isLiteTool) liteTool.onClick(e);
        else if (state.isShapeTool) {
            shapeTool.addShape(e);
            shapeTool.onDragEnd(e);
        }

        this.render();
    };

    private _onHover = (e: CanvasEvent) => {
        // this.penTool.refreshCursorWidgets(e);

        this.liteTool.onHover(e);
        this.render();
    };

    private _onMouseOut = (_e: CanvasEvent) => {
        this.state.mouseInCanvas = false;
        this.render();
        if (this.state.isShapeTool && this.state.dragging) {
            const e = new MouseEvent('mouseup');
            this.canvas.dispatchEvent(e);
        }
    };

    private _onDblClick = (e: CanvasEvent) => {
        const { state, liteTool } = this;
        if (state.isLiteTool) {
            liteTool.onDblClick(e);
        }
    };

    private _initEventHandlers() {
        initEvents(
            this.canvas,
            this._onDragStart,
            this._onDragMove,
            this._onDragEnd,
            this._onClick,
            this._onDblClick,
            (e: CanvasEvent) => {
                this.state.mouseInCanvas = true;
                if (this.state.dragging) return;

                this._onHover(e);
            },
            this._onMouseOut,
        );
        initKeyEvents(this);
    }

    /**
     * debug only
     */
    hideWidgets() {
        this.scene.children.forEach((child) => {
            child.visible = false;
        });
        this.paths.forEach((path) => {
            path.offset.visible = true;
        });
        this.view.update();
    }

    render() {
        beforeRenderHoverCurve(this);
        beforeRenderAnchor(this);
        beforeRenderHandle(this);
        beforeRenderMain(this);
        this.view.update();
        afterRenderAnchor(this);
    }

    setCursor(name: string) {
        if (this.state.isShapeTool) {
            const opt = { args: { fill: '#636C78', stroke: '#fff' } };
            this.editor.cursorController.fixedCursor(name, opt);
        } else if (this.state.isLiteTool) {
            this.editor.cursorController.fixedCursor(name);
        } else {
            this.editor.cursorController.fixedCursor('default');
        }
    }

    resetPaths() {
        this.paths.forEach((editablePath) => editablePath.remove());
        this.paths = [];
        this.paths = [new EditablePath(this)];
    }
}
