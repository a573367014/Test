import paper from 'paper';
import { colors, sizes } from './consts';
import type { IPathElementModel } from '@gaoding/editor-framework/src/types/editor';
import type { AnchorType, PathEditorContext } from './context';
import {
    EditableAnchor,
    EditablePath,
    CurveTarget,
    AnchorTarget,
    HandleTarget,
    AnchorHoverTarget,
    PathTarget,
} from './widgets';
import { CanvasEvent } from './events';
import { PaperOffset } from '../paper-offset';
import { getRectRenderRadius, modelColorToPaperColor, paperColorToModelColor } from '../utils';
import { ICreateShapeOptions, PaperColor } from '../types';

const { Path, Point, Shape, Rectangle, Segment } = paper;

export type AnchorPoint = paper.Shape.Rectangle;

export interface Point2D {
    x: number;
    y: number;
}

export function initPaper(canvas: HTMLCanvasElement): paper.PaperScope {
    const _paper = new paper.PaperScope(); // 多editor实例会导致global paper被污染
    _paper.setup(canvas);
    _paper.settings.insertItems = false;
    _paper.view.autoUpdate = false;
    return _paper;
}

export function isFarEnough(a: Point2D, b: Point2D, d = 2) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) > d * d;
}

export function isCloseEnough(a: Point2D, b: Point2D, d = 4) {
    return !isFarEnough(a, b, d);
}

export function isAlmostEqual(a: number, b: number, d = 8) {
    return Math.abs(a - b) < d;
}

export function insertAfter(context: PathEditorContext, target: paper.Item, item: paper.Item) {
    const i = context.scene.children.indexOf(target);
    context.scene.insertChild(i + 1, item);
}

export function insertBefore(context: PathEditorContext, target: paper.Item, item: paper.Item) {
    const i = context.scene.children.indexOf(target);
    context.scene.insertChild(i, item);
}

export function cloneWithReplace<T extends paper.Path | paper.Shape | paper.CompoundPath>(
    dataPath: T,
    oldStylePath: T,
): T {
    const newPath = dataPath.clone() as T;
    newPath.fillColor = oldStylePath.fillColor;
    newPath.strokeColor = oldStylePath.strokeColor;
    newPath.strokeWidth = oldStylePath.strokeWidth;
    oldStylePath.replaceWith(newPath);
    return newPath;
}

export function loadModel(context: PathEditorContext, model: IPathElementModel) {
    let pathData = model.path;

    if (model.isRect() && model.radius) {
        const shape = new paper.Shape.Rectangle(
            new paper.Rectangle(createPoint(), createPoint(model.width, model.height)),
        );
        shape.radius = getRectRenderRadius(model);
        pathData = shape.toPath(false).pathData;
    }

    const lines = pathData
        .split('M')
        .splice(1)
        .map((s) => 'M' + s);

    context.paths.forEach((editablePath) => editablePath.remove());
    context.paths = [];

    for (const commands of lines) {
        const path = new paper.Path(commands);
        _transformPathWithModel(path, model);

        const editablePath = new EditablePath(context);
        const closed = commands[commands.length - 1].toUpperCase() === 'Z';
        editablePath.main = cloneWithReplace(
            new Path({ closed, visible: false }),
            editablePath.main,
        );
        editablePath.hint = cloneWithReplace(new Path({ closed }), editablePath.hint);

        context.paths.push(editablePath);
        path.segments.map((a) => context.penTool.addAnchor(editablePath, a));
    }
    loadStyle(context, model);
    context.currentPath.pickedAnchors.clear();
}

function _transformPathWithModel(path: paper.Path, model: IPathElementModel) {
    if (isLinePath(path)) {
        const strokeType = model.$currentPathEffect.lineType;

        let offsetY = model.top;
        if (strokeType === 'center') offsetY = model.top + model.height / 2;
        if (strokeType === 'outer') offsetY = model.top + model.height;
        path.translate(createPoint(model.left, offsetY));

        let verticalOffset = 0;
        if (strokeType === 'inner') verticalOffset = model.height / 2;
        else if (strokeType === 'outer') verticalOffset = -model.height / 2;
        const rotateCenter = createPoint(
            path.bounds.x + model.width / 2,
            path.bounds.y + verticalOffset,
        );
        path.rotate(model.rotate, rotateCenter);
    } else {
        path.translate(createPoint(model.left, model.top));
        path.rotate(model.rotate);
    }
}

/**
 * 加载主路径样式
 */
export function loadStyle(context: PathEditorContext, model: IPathElementModel) {
    const { currentPath } = context;
    const { main } = currentPath;
    // 路径样式
    main.strokeColor = new paper.Color(model.$currentPathEffect.color);
    main.strokeWidth = model.$currentPathEffect.width;
    main.opacity = model.opacity;
    model.$fillColor && (main.fillColor = modelColorToPaperColor(model, true));
    context.strokeType = model.$currentPathEffect.lineType || 'center';
}

export function exportModel(context: PathEditorContext, model: IPathElementModel) {
    const { state, editor, currentPath } = context;

    if (state.isPenTool || state.isLiteTool) {
        const path = currentPath.main;
        syncModelWithPath(model, path);
    } else if (state.isShapeTool) {
        const { shape } = context.widgets;

        // 未绘制回收
        if (!shape.bounds.width && !shape.bounds.height) {
            editor.currentElement = null;
            return;
        }

        const path = shape instanceof paper.Shape ? shape.toPath(false) : shape;

        syncModelWithPath(model, path);

        if (state.isRectTool) {
            model.$lookLike = 'rect';
        }

        context.widgets.shape.visible = false;

        editor.addElement(model);
    }

    editor.makeSnapshotByElement(model);
}

function syncModelWithPath(model: IPathElementModel, path: paper.Path) {
    if (isLinePath(path)) {
        const strokeType = model.$currentPathEffect.lineType;
        path = path.clone({ insert: false });
        if (strokeType !== 'center') {
            const offset = strokeType === 'inner' ? -path.strokeWidth / 2 : path.strokeWidth / 2;
            path = PaperOffset.offset(path, offset, {
                insert: false,
            }) as paper.Path;
        }
        model.rotate = path.lastSegment.point.subtract(path.firstSegment.point).angle;
        path.rotate(-model.rotate);
        const bounds = path.bounds;
        const strokeBounds = path.strokeBounds;
        model.left = strokeBounds.x;
        model.top = strokeBounds.y;
        model.width = bounds.width;
        model.height = Math.max(1, path.strokeWidth);
    } else {
        path.rotate(-model.rotate);
        const bounds = path.bounds;
        model.left = bounds.x;
        model.top = bounds.y;
        model.width = bounds.width;
        model.height = Math.max(1, bounds.height);
    }

    // 新绘制图形
    if (!model.path && path.fillColor) {
        model.$currentPathEffect.filling = paperColorToModelColor(path.fillColor);
    }

    path.translate(createPoint(-path.bounds.x, -path.bounds.y));
    model.path = path.pathData;
    model.$currentPathEffect.color = path.strokeColor.toCSS(true);
    model.$currentPathEffect.width = path.strokeWidth;
    if (isLinePath(path)) {
        model.$currentPathEffect.filling = null;
        model.$lookLike = 'line';
        model.resize = 4;
    } else if (isRectPath(path)) {
        model.$lookLike = 'rect';
        model.resize = 7;
    } else {
        model.$lookLike = null;
        model.resize = 7;
    }
}

export function moveAnchor(anchor: EditableAnchor, delta: paper.Point) {
    anchor.point.position = anchor.point.position.add(delta);
    anchor.handleIn.position = addPositionToNoZero(anchor.handleIn.position, delta);
    anchor.handleOut.position = addPositionToNoZero(anchor.handleOut.position, delta);
    anchor.lineIn.position = addPositionToNoZero(anchor.lineIn.position, delta);
    anchor.lineOut.position = addPositionToNoZero(anchor.lineOut.position, delta);
}

export function addPositionToNoZero(position: paper.Point, delta: paper.Point) {
    return !position.isZero() ? position.add(delta) : position;
}

export function moveHandle(path: EditablePath, i: number, delta: paper.Point, isHandleIn: boolean) {
    const anchor = path.anchors[i];
    const anchorHandle = isHandleIn ? anchor.handleIn : anchor.handleOut;
    const followHandle = isHandleIn ? anchor.handleOut : anchor.handleIn;
    const mainSegment = path.main.segments[i];
    const hintSegment = path.hint.segments[i];

    anchorHandle.position = anchorHandle.position.add(delta);
    if (anchor.anchorType === 'fullMirror') {
        followHandle.position = followHandle.position.subtract(delta);
    } else if (anchor.anchorType === 'angleMirror') {
        const len = followHandle.position.getDistance(anchor.point.position);
        const angle = anchor.point.position.subtract(anchorHandle.position).angle;
        followHandle.position = createPoint(len, 0).rotate(angle, null).add(anchor.point.position);
    }

    const line = new paper.Path.Line(anchor.point.position, anchorHandle.position);
    const followLine = !followHandle.position.isZero()
        ? new paper.Path.Line(anchor.point.position, followHandle.position)
        : null;

    mainSegment.handleIn = anchor.segment.handleIn;
    hintSegment.handleIn = anchor.segment.handleIn;
    mainSegment.handleOut = anchor.segment.handleOut;
    hintSegment.handleOut = anchor.segment.handleOut;
    if (isHandleIn) {
        anchor.lineIn = cloneWithReplace(line, anchor.lineIn);
        if (followLine) anchor.lineOut = cloneWithReplace(followLine, anchor.lineOut);
    } else {
        anchor.lineOut = cloneWithReplace(line, anchor.lineOut);
        if (followLine) anchor.lineIn = cloneWithReplace(followLine, anchor.lineIn);
    }
}

function updateShapeByBound(context: PathEditorContext, bound: paper.Rectangle) {
    const { state, widgets } = context;
    if (state.isRectTool) {
        widgets.shape = cloneWithReplace(new Shape.Rectangle(bound), widgets.shape);
    } else if (state.isEllipseTool) {
        widgets.shape = cloneWithReplace(new Shape.Ellipse(bound), widgets.shape);
    } else if (state.isTriangleTool) {
        const { topCenter, bottomLeft, bottomRight } = bound;
        const path = new Path([topCenter, bottomLeft, bottomRight]);
        path.closePath();
        widgets.shape = cloneWithReplace(path, widgets.shape);
    } else if (state.isLineTool) {
        const { topLeft, bottomRight } = bound;
        const path = new Path([topLeft, bottomRight]);
        widgets.shape = cloneWithReplace(path, widgets.shape);
    }
}

export function updateShape(context: PathEditorContext, e: CanvasEvent) {
    const { state, widgets } = context;
    const from = createPoint(e.start.x, e.start.y, context.modelScale);
    const to = createPoint(e.x, e.y, context.modelScale);
    if (state.isRectTool || state.isEllipseTool || state.isTriangleTool) {
        const bound = new Rectangle(from, to);
        if (e.keys.shift) {
            const size = Math.max(bound.width, bound.height);
            bound.width = bound.height = size;
        }

        // 动态更新渐变值范围
        const shape = widgets.shape;
        if (shape.fillColor && shape.fillColor.type === 'gradient') {
            const fillColor = shape.fillColor as PaperColor;
            const { left, top, width, height } = shape.bounds;
            if (!width) {
                fillColor.origin.x += left;
                fillColor.origin.y += top;
            } else {
                fillColor.destination.x = fillColor.origin.x + width;
                fillColor.destination.y = fillColor.origin.y;
            }
        }

        updateShapeByBound(context, bound);
    } else if (state.isLineTool) {
        const path = new Path([from, to]);
        widgets.shape = cloneWithReplace(path, widgets.shape);
    }
    widgets.shape.visible = true;
}

export function addShape(context: PathEditorContext, e: CanvasEvent) {
    const { width, height, modelScale } = context;
    const size = Math.min(width / 2, height / 2);
    const center = createPoint(e.x, e.y, modelScale);
    const half = createPoint(size / 2, size / 2, modelScale);
    const from = center.subtract(half);
    const to = center.add(half);
    const bound = new Rectangle(from, to);
    updateShapeByBound(context, bound);
}

export function testPreAddPoint(context: PathEditorContext, point: paper.Point): boolean {
    const { hoverPreAddPoint, centerPreAddPoint } = context.widgets;
    centerPreAddPoint.fillColor = colors.white;

    let hasPreAddPoint = false;
    for (const curve of context.currentPath.main.curves) {
        const nearest = curve.getNearestPoint(point);
        const center = createPoint(
            (curve.segment1.point.x + curve.segment2.point.x) / 2,
            (curve.segment1.point.y + curve.segment2.point.y) / 2,
        );

        // nearest 与 point 足够近时，需在该段 curve 上展示预添加锚点
        if (isCloseEnough(nearest, point, 6 * context.modelScale)) {
            hasPreAddPoint = true;
            hoverPreAddPoint.position = nearest;

            // 直线上必存在 center 点，可能存在 hover 点
            if (curve.isStraight()) {
                centerPreAddPoint.visible = true;
                centerPreAddPoint.position = center;
                // 离 center 足够近时，仅使用 center 并使其高亮
                if (isCloseEnough(nearest, center, 6 * context.modelScale)) {
                    hoverPreAddPoint.visible = false;
                    centerPreAddPoint.fillColor = colors.lightBlue;
                } else {
                    hoverPreAddPoint.visible = true;
                }
            }
            // 曲线上只存在 hover 点
            else {
                centerPreAddPoint.visible = false;
                hoverPreAddPoint.visible = true;
            }

            break;
        }
    }

    if (!hasPreAddPoint) {
        hoverPreAddPoint.visible = centerPreAddPoint.visible = false;
    }

    return hasPreAddPoint;
}

export function testAnchorHover(context: PathEditorContext, point: paper.Point): boolean {
    const { state, currentPath, modelScale } = context;
    for (let i = 0; i < currentPath.main.segments.length; i++) {
        const segment = currentPath.main.segments[i];
        const closeEnough = isCloseEnough(segment.point, point, sizes.hoverRadius * modelScale);
        if (closeEnough) {
            state.hoverTarget = new AnchorHoverTarget(currentPath, i);
            context.widgets.hoverPreAddPoint.visible = false;
            return true;
        }
    }
    return false;
}

export function testHandleHover(context: PathEditorContext, point: paper.Point): boolean {
    const { currentPath, state, modelScale } = context;
    let hitHandle: paper.Shape.Circle = null;
    let isHandleIn = false;
    let hitIndex = -1;
    for (let i = 0; i < currentPath.anchors.length; i++) {
        const anchor = currentPath.anchors[i];
        const { handleIn, handleOut } = anchor;
        const hitResultIn = isCloseEnough(handleIn.position, point, sizes.hoverRadius * modelScale);
        const hitResultOut = isCloseEnough(
            handleOut.position,
            point,
            sizes.hoverRadius * modelScale,
        );

        if (hitResultIn && !handleIn.position.equals(anchor.point.position)) {
            hitHandle = handleIn;
        }
        if (hitResultOut && !handleOut.position.equals(anchor.point.position)) {
            hitHandle = handleOut;
        }

        hitIndex = i;
        isHandleIn = hitResultIn && !hitResultOut;
        if (hitResultIn || hitResultOut) break;
    }
    if (hitHandle) {
        state.hoverTarget = new HandleTarget(currentPath, hitIndex, isHandleIn);
        return true;
    } else {
        state.hoverTarget = null;
        return false;
    }
}

export function testCurveDrag(context: PathEditorContext, e: CanvasEvent): boolean {
    const { currentPath, state } = context;
    const point = createPoint(e.x, e.y, context.modelScale);
    const hitResult = currentPath.main.hitTest(point);
    if (hitResult?.location?.curve) {
        const { index } = hitResult.location.curve;
        state.dragTarget = new CurveTarget(currentPath, index);
        return true;
    }
    return false;
}

export function testPathDrag(context: PathEditorContext, e: CanvasEvent): boolean {
    const { currentPath, state } = context;
    const res = context.scene.hitTest(createPoint(e.x, e.y, context.modelScale));
    if (res?.item.className === 'Path') {
        state.dragTarget = new PathTarget(currentPath);
        return true;
    }
    return false;
}

export function testAnchorMousedown(
    context: PathEditorContext,
    e: CanvasEvent,
    isDrag: boolean,
): boolean {
    const { state, currentPath, widgets, modelScale } = context;
    const newPickedAnchors = new Set<number>();
    const point = createPoint(e.x, e.y, context.modelScale);

    for (let i = 0; i < currentPath.main.segments.length; i++) {
        const segment = currentPath.main.segments[i];
        const closeEnough = isCloseEnough(segment.point, point, sizes.hoverRadius * modelScale);
        if (closeEnough) {
            // 原有参考线偏移调整，未适配 zoom
            // const [snap] = getSnap(context, point.x, point.y);
            // const baseOffset = createPoint(snap.x - segment.point.x, snap.y - segment.point.y);
            // const snapPoint = createPoint(snap.x, snap.y);
            // moveAnchor(currentPath.anchors[i], baseOffset);
            // segment.point = snapPoint;
            // currentPath.hint.segments[i].point = snapPoint;
            newPickedAnchors.add(i);

            // 若按住 command 拖拽锚点，转为以 fullMirror 类型形式重置控制点
            if (e.keys.cmd && isDrag) {
                // 此时不允许多个 pickedAnchor
                currentPath.pickedAnchors.clear();
                currentPath.pickedAnchors.add(i);
                const anchor = currentPath.anchors[i];
                currentPath.setAnchorType('fullMirror');
                anchor.setHandleIn(createPoint(0.1, 0.1));
                anchor.setHandleOut(createPoint(0.1, 0.1));
                currentPath.main.segments[i] = anchor.segment.clone();
                currentPath.hint.segments[i] = anchor.segment.clone();
                break;
            }
        }
    }

    if (newPickedAnchors.size === 0) return false;
    else if (newPickedAnchors.size > 1) {
        // 选择重叠最上层anchor
        let targetIndex = 0;
        newPickedAnchors.forEach((i) => {
            const seg = currentPath.main.segments[i];
            const targetSeg = currentPath.main.segments[targetIndex];
            if (seg.index > targetSeg.index) targetIndex = i;
        });
        newPickedAnchors.clear();
        newPickedAnchors.add(targetIndex);
    }

    {
        let moveTogether = false;
        currentPath.pickedAnchors.forEach((i) => {
            if (newPickedAnchors.has(i)) moveTogether = true;
        });
        if (!moveTogether) currentPath.pickedAnchors.clear();

        for (const i of newPickedAnchors) {
            currentPath.pickAnchor(i);
        }

        state.dragTarget = new AnchorTarget(currentPath);
        widgets.centerPreAddPoint.visible = widgets.hoverPreAddPoint.visible = false;
        return true;
    }
}

export function testHandleDrag(context: PathEditorContext, e: CanvasEvent): boolean {
    const { currentPath, state, widgets, modelScale, liteTool } = context;
    const point = createPoint(e.x, e.y, context.modelScale);
    let hitHandle: paper.Shape.Circle = null;
    let isHandleIn = false;
    let hitIndex = -1;
    for (let i = 0; i < currentPath.anchors.length; i++) {
        const anchor = currentPath.anchors[i];
        const { handleIn, handleOut } = anchor;
        const hitResultIn = isCloseEnough(handleIn.position, point, sizes.hoverRadius * modelScale);
        const hitResultOut = isCloseEnough(
            handleOut.position,
            point,
            sizes.hoverRadius * modelScale,
        );

        if (hitResultIn && !handleIn.position.equals(anchor.point.position)) {
            hitHandle = handleIn;
        }
        if (hitResultOut && !handleOut.position.equals(anchor.point.position)) {
            hitHandle = handleOut;
        }

        hitIndex = i;
        isHandleIn = hitResultIn && !hitResultOut;
        if (hitResultIn || hitResultOut) {
            // 按住 command 时的初始化行为
            if (e.keys.cmd) {
                const baseDelta = isHandleIn
                    ? handleIn.position.subtract(anchor.point.position)
                    : handleOut.position.subtract(anchor.point.position);
                liteTool.setAnchorType('fullMirror', new Set([i]));
                anchor.setHandleIn(createPoint(0.1, 0.1));
                anchor.setHandleOut(createPoint(0.1, 0.1));
                moveHandle(currentPath, i, baseDelta, isHandleIn);
            }
            // 按住 alt 时的初始化行为
            if (e.keys.alt) {
                liteTool.setAnchorType('noMirror', new Set([i]));
            }
            break;
        }
    }

    if (hitHandle) {
        state.dragTarget = new HandleTarget(currentPath, hitIndex, isHandleIn);
        widgets.centerPreAddPoint.visible = widgets.hoverPreAddPoint.visible = false;
        return true;
    }
    return false;
}

export function trySwitchAnchorType(context: PathEditorContext, point: paper.Point) {
    const { currentPath, modelScale, liteTool } = context;

    for (let i = 0; i < currentPath.main.segments.length; i++) {
        const segment = currentPath.main.segments[i];
        const closeEnough = isCloseEnough(segment.point, point, sizes.hoverRadius * modelScale);
        const anchor = currentPath.anchors[i];
        if (closeEnough) {
            const isSharp = anchor.handleIn.position.isZero() && anchor.handleOut.position.isZero();
            const picked = new Set<number>().add(i);
            if (isSharp) {
                liteTool.setAnchorType('angleMirror', picked);
            } else {
                liteTool.setAnchorType('sharp', picked);
            }
        }
    }
}

export function addAnchorToScene(context: PathEditorContext, anchor: EditableAnchor) {
    const { widgets } = context;
    insertBefore(context, widgets.cursorPath, anchor.point);
    insertAfter(context, widgets.hoverCurve, anchor.handleIn);
    insertAfter(context, widgets.hoverCurve, anchor.lineIn);
    insertAfter(context, widgets.hoverCurve, anchor.handleOut);
    insertAfter(context, widgets.hoverCurve, anchor.lineOut);
}

export function insertAnchor(context: PathEditorContext, position: paper.Point) {
    const { currentPath, widgets } = context;
    const locationMain = currentPath.main.getNearestLocation(position);
    const locationHint = currentPath.hint.getNearestLocation(position);
    currentPath.main.divideAt(locationMain);
    currentPath.hint.divideAt(locationHint);
    widgets.centerPreAddPoint.visible = widgets.hoverPreAddPoint.visible = false;

    const anchor = new EditableAnchor(createSegment(position.x, position.y));
    let inserted = false;
    for (let i = 0; i < currentPath.main.segments.length; i++) {
        const segment = currentPath.main.segments[i];
        if (isCloseEnough(segment.point, anchor.point.position, 2)) {
            inserted = true;
            currentPath.anchors.splice(i, 0, anchor);
            currentPath.pickAnchor(i);
            anchor.setHandleIn(segment.handleIn);
            anchor.setHandleOut(segment.handleOut);
            break;
        }
    }
    if (!inserted) {
        console.error('新增 anchor 未正确同步');
    }

    addAnchorToScene(context, anchor);
}

export function refreshPickerFrame(context: PathEditorContext, e: CanvasEvent) {
    const newFrame = createPickerFrame(e.start.x, e.start.y, e.x, e.y, context.modelScale);
    const { currentPath } = context;
    context.widgets.pickerFrame.replaceWith(newFrame);
    context.widgets.pickerFrame = newFrame;
    context.widgets.pickerFrame.visible = true;

    currentPath.anchors.forEach((anchor, i) => {
        const result = newFrame.hitTest(anchor.point.position);
        if (result) currentPath.pickAnchor(i);
        else currentPath.removePickedAnchor(i);
    });
}

function refreshGuides(
    context: PathEditorContext,
    snappedPoint: paper.Point,
    targets: paper.Point[],
) {
    const { widgets } = context;
    const { pickerFrame } = widgets;
    widgets.guides.forEach((guide) => guide.remove());

    const newGuides: paper.Path.Line[] = [];
    targets.forEach((targetPoint) => {
        const guide = createGuide(snappedPoint, targetPoint);
        newGuides.push(guide);
        insertAfter(context, pickerFrame, guide);
    });
    widgets.guides = newGuides;
}

export function getSnap(
    context: PathEditorContext,
    x: number,
    y: number,
): [Point2D, paper.Point[]] {
    x *= context.modelScale;
    y *= context.modelScale;
    let snappedX = false;
    let snappedY = false;
    const snapTargets: paper.Point[] = [];
    const snap = { x, y };

    const { anchors, pickedAnchors } = context.currentPath;
    for (let i = 0; i < anchors.length; i++) {
        if (pickedAnchors.has(i)) continue;

        const anchor = anchors[i].point.position;
        if (isAlmostEqual(anchor.x, x)) {
            snappedX = true;
            snap.x = anchor.x;
            if (!snappedY) snap.y = y;
            snapTargets.push(anchor);
        }
        if (isAlmostEqual(anchor.y, y)) {
            snappedY = true;
            snap.y = anchor.y;
            if (!snappedX) snap.x = x;
            snapTargets.push(anchor);
        }
        if (snappedX && snappedY) break;
    }
    return [snap, snapTargets];
}

export function refreshSnapGuides(context: PathEditorContext, e: CanvasEvent) {
    const [snap, snapTargets] = getSnap(context, e.x, e.y);
    const snappedPoint = createPoint(snap.x, snap.y);
    refreshGuides(context, snappedPoint, snapTargets);
}

export function resetSnapGuides(context: PathEditorContext) {
    context.widgets.guides.forEach((guide) => guide.remove());
    context.widgets.guides = [];
}

function tryMergeAdjacentAnchor(context: PathEditorContext, point: paper.Point): boolean {
    const path = context.currentPath;
    for (let i = 0; i < path.anchors.length; i++) {
        const anchor = path.anchors[i];
        if (path.pickedAnchors.has(i)) {
            const prev = path.anchors[i - 1];
            const next = path.anchors[i + 1];
            const mergePrev =
                prev &&
                isCloseEnough(
                    prev.point.position,
                    anchor.point.position,
                    sizes.anchorMergeRadius * context.modelScale,
                );
            const mergeNext =
                next &&
                isCloseEnough(
                    next.point.position,
                    anchor.point.position,
                    sizes.anchorMergeRadius * context.modelScale,
                );
            if (mergePrev || mergeNext) {
                let removeIndex: number = null;
                if (mergePrev) {
                    removeIndex = path.tempAlign.has(i) ? i - 1 : i;
                } else {
                    removeIndex = path.tempAlign.has(i) ? i + 1 : i;
                }
                path.main.removeSegment(removeIndex);
                path.hint.removeSegment(removeIndex);
                path.anchors[removeIndex].remove();
                path.anchors.splice(removeIndex, 1);

                path.pickedAnchors.clear();
                path.anchors.forEach((anchor, i) => {
                    if (anchor.point.hitTest(point)) path.pickAnchor(i);
                });
                return true;
            }
        }
    }

    return false;
}

function isHeadTailOverlapping(path: EditablePath): boolean {
    if (path.pickedAnchors.size !== 1) return false;

    const { anchors } = path;
    const last = anchors.length - 1;
    if (path.pickedAnchors.has(0) || path.pickedAnchors.has(last)) {
        if (isCloseEnough(anchors[0].point.position, anchors[last].point.position)) {
            // 保证起止锚点位置完全一致，此时方可令 paper 合并起止的 segement
            anchors[last].point.position =
                path.main.segments[last].point =
                path.hint.segments[last].point =
                    anchors[0].point.position;
            return true;
        }
    }

    return false;
}

export function tryMergeAnchors(context: PathEditorContext, point: paper.Point) {
    const { state, currentPath } = context;
    if (!(state.dragTarget instanceof AnchorTarget)) return;

    const { pickedAnchors, anchors } = currentPath;
    const anchorSlice = Array.from(pickedAnchors);
    const allOverlapped = anchorSlice.every((i) =>
        isCloseEnough(anchors[i].point.position, anchors[0].point.position),
    );
    const hasMultiDifferentPosition = pickedAnchors.size > 1 && !allOverlapped;
    // 若有多个不同位置的 anchor 被多选拖拽，不应 merge
    if (hasMultiDifferentPosition) return;

    if (pickedAnchors.size === 1) {
        // 若 pickedAnchor 为起止锚点且停留在另一端上，关闭该路径
        if (isHeadTailOverlapping(currentPath)) {
            currentPath.main.closePath();
            currentPath.hint.closePath();

            const lastIndex = currentPath.anchors.length - 1;
            currentPath.anchors[lastIndex].remove();
            currentPath.anchors.pop();
            currentPath.pickedAnchors.delete(lastIndex);
        }
        // 若移动到相邻锚点上，合并两锚点
        else if (tryMergeAdjacentAnchor(context, point)) {
            return 0;
        }
    }
    // 若所有 pickedAnchor 均在相同坐标，此时可能停在一个非 picked 的 anchor 上
    // 但此时该位置所有锚点会自然形成联动，无需特殊处理
    // else if (allOverlapped) {}
}

export function beforeRenderCursor(context: PathEditorContext) {
    const { state, widgets, currentPath } = context;
    const { cursorPoint, cursorPath } = widgets;
    const cursorVisible = state.isPenTool && state.usePenCursor && state.mouseInCanvas;
    cursorPoint.visible = cursorVisible;
    cursorPath.visible =
        cursorVisible &&
        currentPath.pickedPositions.every((position) =>
            isFarEnough(position, cursorPoint.position),
        );
}

export function beforeRenderHoverCurve(context: PathEditorContext) {
    const { state, widgets, modelScale } = context;

    scaleItem(widgets.centerPreAddPoint, modelScale);
    scaleItem(widgets.hoverPreAddPoint, modelScale);

    if (!(state.dragTarget instanceof CurveTarget)) return;

    const { path, index } = state.dragTarget;
    if (path !== null) {
        const curve = path.hint.curves[index];
        const segment = new Path();
        segment.add(curve.segment1, curve.segment2);
        widgets.hoverCurve = cloneWithReplace(segment, widgets.hoverCurve);
        widgets.hoverCurve.visible = true;
    } else {
        widgets.hoverCurve.visible = false;
    }
}

function setAnchorStyle(anchor: AnchorPoint, picked: boolean, hover: boolean) {
    if (!picked) {
        anchor.fillColor = colors.white;
        anchor.strokeColor = hover ? colors.lighterBlue : colors.lightBlue;
    } else {
        anchor.strokeColor = anchor.fillColor = colors.lightBlue;
    }
}

function setHandleStyle(handle: paper.Shape.Circle, _line: paper.Path.Line, hover: boolean) {
    if (hover) {
        handle.fillColor = colors.lightBlue;
    } else {
        handle.fillColor = colors.white;
    }
}

function scaleItem(item: paper.Item, val: number) {
    item.matrix.a = item.matrix.d = val;
}

export function beforeRenderAnchor(context: PathEditorContext) {
    const { state, currentPath, modelScale } = context;
    const { pickedAnchors, anchors } = currentPath;
    const { hoverTarget } = state;

    // 设置锚点 hover 状态
    anchors.forEach((anchor, i) => {
        const picked = pickedAnchors.has(i);
        const hover =
            hoverTarget && hoverTarget instanceof AnchorHoverTarget && hoverTarget.index === i;
        setAnchorStyle(anchor.point, picked, hover);
        scaleItem(anchor.point, modelScale);
        scaleItem(anchor.handleIn, modelScale);
        scaleItem(anchor.handleOut, modelScale);
    });

    currentPath.setTempAlign();
}

export function beforeRenderHandle(context: PathEditorContext) {
    const { dragTarget, hoverTarget } = context.state;

    let target: HandleTarget = null;
    if (dragTarget && dragTarget instanceof HandleTarget) {
        target = dragTarget;
    }
    if (hoverTarget && hoverTarget instanceof HandleTarget) {
        target = hoverTarget;
    }

    if (target) {
        const { path, index, handleFlag } = target;
        const anchor = path.anchors[index];
        handleFlag
            ? setHandleStyle(anchor.handleIn, anchor.lineIn, true)
            : setHandleStyle(anchor.handleOut, anchor.lineOut, true);
    }
}

export function beforeRenderMain(context: PathEditorContext) {
    const { strokeType, paths } = context;
    paths.forEach((path) => {
        const { main } = path;
        let dataPath: paper.Path | paper.CompoundPath = main.clone({ insert: false });
        if (strokeType !== 'center') {
            const d = strokeType === 'inner' ? -1 : 1;
            dataPath = PaperOffset.offset(dataPath, (dataPath.strokeWidth / 2) * d, {
                insert: false,
            });
        }
        dataPath.visible = true;
        path.offset.remove();
        path.offset = dataPath as paper.Path;
        context.scene.insertChild(0, path.offset);
    });
}

export function afterRenderAnchor(context: PathEditorContext) {
    const { currentPath } = context;

    currentPath.pickedAnchors.forEach((index) => {
        const pickedAnchor = currentPath.anchors[index].point;
        setAnchorStyle(pickedAnchor, true, false);
    });

    currentPath.anchors.forEach((anchor) => {
        setAnchorStyle(anchor.point, false, false);
        setHandleStyle(anchor.handleIn, anchor.lineIn, false);
        setHandleStyle(anchor.handleOut, anchor.lineOut, false);
    });

    currentPath.resetTempAlign();
}

export function createPoint(x = 0, y = 0, scale = 1) {
    return new Point(x * scale, y * scale);
}

export function createSegment(x = 0, y = 0) {
    return new Segment(createPoint(x, y));
}

export function createAnchorPoint(x = 0, y = 0): AnchorPoint {
    const anchor = new Shape.Rectangle({
        center: [x, y],
        size: sizes.anchorSize,
    });
    anchor.strokeColor = colors.lightBlue;
    anchor.strokeWidth = sizes.anchorStrokeWidth;
    anchor.fillColor = colors.white;
    return anchor as unknown as AnchorPoint;
}

export function createCursorPoint() {
    const cursorPoint = new Shape.Circle(createPoint(), sizes.anchorRadius);
    cursorPoint.strokeColor = colors.lightBlue;
    cursorPoint.fillColor = colors.white;
    cursorPoint.visible = false;
    return cursorPoint;
}

export function createPreAddPoint(fill: boolean) {
    const cursorPoint = new Shape.Circle(createPoint(), sizes.anchorRadius);
    cursorPoint.strokeColor = colors.lightBlue;
    cursorPoint.fillColor = fill ? colors.lightBlue : colors.white;
    cursorPoint.visible = false;
    return cursorPoint;
}

export function createMainPath() {
    const path = new Path();
    path.strokeColor = colors.black;
    path.strokeWidth = 4; // debug
    return path;
}

export function createHintPath() {
    const hintPath = new Path();
    hintPath.strokeColor = colors.lightBlue;
    return hintPath;
}

export function createCursorPath() {
    const cursorPath = new Path();
    cursorPath.strokeColor = colors.lightBlue;
    return cursorPath;
}

export function createHoverCurve() {
    const hoverCurve = new Path();
    hoverCurve.strokeColor = colors.white;
    hoverCurve.visible = false;
    return hoverCurve;
}

export function createAnchorHandle() {
    const anchorHandle = new Shape.Circle(createPoint(), sizes.handleRadius);
    anchorHandle.fillColor = colors.white;
    anchorHandle.strokeColor = colors.lightBlue;
    anchorHandle.visible = false;
    return anchorHandle;
}

export function createAnchorLine() {
    const anchorLine = new Path.Line(createPoint(), createPoint());
    anchorLine.strokeColor = colors.lightBlue;
    anchorLine.visible = false;
    return anchorLine;
}

export function createPickerFrame(x1: number, y1: number, x2: number, y2: number, scale = 1) {
    const point1 = createPoint(Math.min(x1, x2), Math.min(y1, y2), scale);
    const point2 = createPoint(Math.max(x1, x2), Math.max(y1, y2), scale);
    const pickerFrame = new Shape.Rectangle(point1, point2);
    pickerFrame.fillColor = colors.lightBlue;
    pickerFrame.opacity = 0.15;
    pickerFrame.visible = false;
    return pickerFrame;
}

function createGuide(point1: paper.Point, point2: paper.Point) {
    const guide = new Path.Line(point1, point2);
    guide.strokeColor = colors.red;
    return guide;
}

export function createShape(options: ICreateShapeOptions = {}) {
    const shape = new Shape();
    shape.fillColor = options.fillColor || colors.defaultFill;
    shape.strokeColor = options.strokeColor || colors.defaultStroke;
    shape.strokeWidth = options.strokeWidth || 0;
    shape.visible = false;
    return shape;
}

export function getAnchorType(anchor: EditableAnchor): AnchorType {
    if (anchor.anchorType) return anchor.anchorType;
    const { handleIn, handleOut } = anchor;
    const p0 = handleIn.position;
    const p1 = anchor.point.position;
    const p2 = handleOut.position;
    if (p0.isZero() && p2.isZero()) {
        return 'sharp';
    } else if (Math.abs(p0.subtract(p1).angle - p1.subtract(p2).angle) < 0.001) {
        if (p1.getDistance(p0) === p1.getDistance(p2)) return 'fullMirror';
        else return 'angleMirror';
    } else return 'noMirror';
}

export function isLinePath(path: paper.Path) {
    return (
        path.segments.length === 2 &&
        !path.segments.filter((seg) => !seg.handleIn.isZero() || !seg.handleOut.isZero()).length
    );
}

export function isRectPath(path: paper.Path) {
    const shape = path.toShape(false);
    return !!shape && shape.type === 'rectangle';
}
