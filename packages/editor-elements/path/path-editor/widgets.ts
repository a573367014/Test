import paper from 'paper';
import type { ICreateShapeOptions, PaperSegment } from '../types';
import { sharpToCurve, toAngleMirror, toFullMirror, toSharp } from './anchor-utils';
import { cursors, sizes } from './consts';
import type { AnchorType, PathEditorContext } from './context';
import {
    addAnchorToScene,
    AnchorPoint,
    cloneWithReplace,
    createAnchorHandle,
    createAnchorLine,
    createAnchorPoint,
    createCursorPath,
    createCursorPoint,
    createHintPath,
    createHoverCurve,
    createMainPath,
    createPickerFrame,
    createPoint,
    createPreAddPoint,
    createShape,
    getAnchorType,
    isCloseEnough,
    moveAnchor,
    moveHandle,
} from './utils';

class BaseTarget {
    path: EditablePath;
    constructor(path: EditablePath) {
        this.path = path;
    }
}

export class CurveTarget extends BaseTarget {
    index: number;
    constructor(path: EditablePath, index: number) {
        super(path);
        this.index = index;
    }
}

export class AnchorTarget extends BaseTarget {}

export class PathTarget extends BaseTarget {}

export class AnchorHoverTarget extends AnchorTarget {
    index: number;
    constructor(path: EditablePath, index: number) {
        super(path);
        this.index = index;
    }
}

export class HandleTarget extends BaseTarget {
    index: number;
    handleFlag: boolean;
    constructor(path: EditablePath, index: number, handleFlag: boolean) {
        super(path);
        this.index = index;
        this.handleFlag = handleFlag;
    }
}

export class Widgets {
    cursorPoint = createCursorPoint();
    cursorPath = createCursorPath();
    hoverCurve = createHoverCurve();
    centerPreAddPoint = createPreAddPoint(false);
    hoverPreAddPoint = createPreAddPoint(true);
    pickerFrame = createPickerFrame(0, 0, 0, 0);
    guides: paper.Path.Line[] = [];
    shape: paper.Shape | paper.Path = createShape();

    /**
     * [
     *   ...shape,
     *   hoverPreAddPoint,
     *   ...editablePaths,
     *   hoverCurve,
     *   ...anchorPoints,
     *   pickerFrame,
     *   ...guides,
     *   centerPreAddPoint,
     *   cursorPath,
     *   cursorPoint,
     * ]
     */
    constructor(context: PathEditorContext) {
        const { scene } = context;

        scene.addChild(this.shape);
        scene.addChild(this.hoverPreAddPoint);
        // path0.main, path0.hint, path1.main, path1.hint...
        scene.addChild(this.hoverCurve);
        // anchors...
        scene.addChild(this.pickerFrame);
        // guides...
        scene.addChild(this.centerPreAddPoint);
        scene.addChild(this.cursorPoint);
    }

    refreshShape(context: PathEditorContext, options: ICreateShapeOptions) {
        this.shape.remove();
        this.shape = createShape(options);
        context.scene.addChild(this.shape);
        context.render();
    }
}

export class EditableAnchor {
    point: AnchorPoint = createAnchorPoint();
    handleIn: paper.Shape.Circle = createAnchorHandle();
    handleOut: paper.Shape.Circle = createAnchorHandle();
    lineIn: paper.Path.Line = createAnchorLine();
    lineOut: paper.Path.Line = createAnchorLine();
    anchorType: AnchorType;

    constructor(segment: PaperSegment) {
        this.point.position = createPoint(segment.point.x, segment.point.y);
        !segment.handleIn.isZero() && this.setHandleIn(segment.handleIn);
        !segment.handleOut.isZero() && this.setHandleOut(segment.handleOut);
        this.anchorType = getAnchorType(this);
    }

    get segment() {
        const hin = this.handleIn.position.isZero()
            ? this.handleIn.position
            : this.handleIn.position.subtract(this.point.position);
        const hout = this.handleOut.position.isZero()
            ? this.handleOut.position
            : this.handleOut.position.subtract(this.point.position);
        return new paper.Segment(this.point.position, hin, hout);
    }

    setHandleIn(handleIn: paper.Point | null) {
        if (!handleIn) {
            this.lineIn = createAnchorLine();
            this.handleIn = createAnchorHandle();
            return;
        } else if (handleIn.isZero()) return;
        this.handleIn.position = this.point.position.add(handleIn);
        const newLine = new paper.Path.Line(this.point.position, this.handleIn.position);
        this.lineIn = cloneWithReplace(newLine, this.lineIn);
        this.handleIn.visible = this.lineIn.visible = true;
    }

    setHandleOut(handleOut: paper.Point | null) {
        if (!handleOut) {
            this.lineOut = createAnchorLine();
            this.handleOut = createAnchorHandle();
            return;
        } else if (handleOut.isZero()) return;
        this.handleOut.position = this.point.position.add(handleOut);
        const newLine = new paper.Path.Line(this.point.position, this.handleOut.position);
        this.lineOut = cloneWithReplace(newLine, this.lineOut);
        this.handleOut.visible = this.lineOut.visible = true;
    }

    remove() {
        this.point.remove();
        this.handleIn.remove();
        this.handleOut.remove();
        this.lineIn.remove();
        this.lineOut.remove();
    }
}

export class EditablePath {
    context: PathEditorContext;
    widgets: Widgets;
    anchors: EditableAnchor[] = [];
    name: string;
    main: paper.Path;
    hint: paper.Path;
    offset: paper.Path;
    pickedAnchors = new Set<number>();
    tempAlign = new Map<number, paper.Point>();

    constructor(context: PathEditorContext) {
        this.context = context;
        this.widgets = context.widgets;
        this.main = createMainPath();
        this.hint = createHintPath();
        this.offset = createMainPath();
        context.scene.insertChild(0, this.hint);
        context.scene.insertChild(0, this.main);
        context.scene.insertChild(0, this.offset);
    }

    get lastAnchor() {
        return this.anchors[this.anchors.length - 1];
    }

    get pickedPositions() {
        const positions: paper.Point[] = [];
        this.pickedAnchors.forEach((index) => positions.push(this.main.segments[index].point));
        return positions;
    }

    addAnchor(anchor: EditableAnchor) {
        const { context, main, hint, anchors } = this;
        anchors.push(anchor);
        main.add(anchor.segment);
        hint.add(anchor.segment);

        addAnchorToScene(context, anchor);
        this.pickedAnchors.clear();
        this.pickedAnchors.add(this.anchors.length - 1);
    }

    setAnchorType(type: AnchorType, pickedAnchors: Set<number> = null) {
        const { anchors, context, main, hint } = this;
        let updated = 0;
        if (!pickedAnchors) {
            pickedAnchors = this.pickedAnchors;
        }

        pickedAnchors.forEach((i) => {
            const anchor = anchors[i];
            if (anchor.anchorType === type) return;

            anchor.remove();
            if (type === 'sharp') {
                toSharp(anchor);
            } else if (anchor.anchorType === 'sharp') {
                sharpToCurve(anchor, anchors, i);
            } else if (type === 'fullMirror') {
                toFullMirror(anchor);
            } else if (type === 'angleMirror') {
                toAngleMirror(anchor);
            }

            anchor.anchorType = type;
            main.removeSegment(i);
            main.insertSegments(i, [anchor.segment]);
            hint.removeSegment(i);
            hint.insertSegments(i, [anchor.segment]);
            addAnchorToScene(context, anchor);
            updated++;
        });
        context.render();
        return !!updated;
    }

    movePickedAnchors(delta: paper.Point) {
        const { main, hint, anchors, pickedAnchors } = this;
        pickedAnchors.forEach((index) => {
            const mainSegment = main.segments[index];
            const hintSegment = hint.segments[index];
            mainSegment.point = mainSegment.point.add(delta);
            hintSegment.point = hintSegment.point.add(delta);
            moveAnchor(anchors[index], delta);
        });
    }

    move(delta: paper.Point) {
        const { main, hint, anchors } = this;
        anchors.forEach((anchor, index) => {
            const mainSegment = main.segments[index];
            const hintSegment = hint.segments[index];
            mainSegment.point = mainSegment.point.add(delta);
            hintSegment.point = hintSegment.point.add(delta);
            moveAnchor(anchor, delta);
        });
    }

    moveHandle(delta: paper.Point) {
        const { dragTarget } = this.context.state;

        if (dragTarget instanceof HandleTarget) {
            const { index, handleFlag } = dragTarget;
            moveHandle(this, index, delta, handleFlag);
        } else if (dragTarget instanceof AnchorTarget) {
            this.pickedAnchors.forEach((index) => {
                moveHandle(this, index, delta, true);
            });
        }
    }

    /** 设置锚点位置为吸附后位置，需在 afterRender 时重置以免 model 数据不同步 */
    setTempAlign() {
        const { anchors, pickedAnchors, context } = this;
        for (let i = 0; i < anchors.length; i++) {
            const picked = pickedAnchors.has(i);
            if (!picked) continue;

            let cursor = context.editor.cursorController.currentCursor;
            cursor === cursors.fitAnchor && (cursor = 'default');
            for (let j = 0; j < anchors.length; j++) {
                if (i === j) continue;
                if (
                    isCloseEnough(
                        anchors[i].point.position,
                        anchors[j].point.position,
                        sizes.anchorMergeRadius * context.modelScale,
                    )
                ) {
                    // 此时应临时吸附至该锚点
                    this.tempAlign.set(i, anchors[i].point.position);
                    const target = anchors[j];
                    anchors[i].point.position = target.point.position;
                    this.main.segments[i].point = target.point.position;
                    this.hint.segments[i].point = target.point.position;
                    cursor = cursors.fitAnchor;
                    break;
                }
            }
            this.context.setCursor(cursor);
        }
    }

    resetTempAlign() {
        this.tempAlign.forEach((point, i) => {
            this.anchors[i].point.position = point;
            this.main.segments[i].point = point;
            this.hint.segments[i].point = point;
        });
        this.tempAlign.clear();
    }

    pickAnchor(index: number) {
        this.pickedAnchors.add(index);
        this.context.events.emit('pickedAnchorChange', this.pickedAnchors);
    }

    removePickedAnchor(index: number) {
        this.pickedAnchors.delete(index);
        this.context.events.emit('pickedAnchorChange', this.pickedAnchors);
    }

    clearPickedAnchor() {
        this.pickedAnchors.clear();
        this.context.events.emit('pickedAnchorChange', this.pickedAnchors);
    }

    remove() {
        const { main, hint, offset } = this;
        main.remove();
        hint.remove();
        offset.remove();
        for (const anchor of this.anchors) {
            anchor.remove();
        }
    }
}
