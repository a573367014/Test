import type { PathEditorContext } from './context';
import { Point2D, isFarEnough } from './utils';
import { Hotkeys } from '@gaoding/editor-utils/hotkeys';

export interface CanvasEvent extends Point2D {
    start: Point2D;
    delta: Point2D;
    keys: {
        shift: boolean;
        /**
         * command 或 control
         */
        cmd: boolean;
        alt: boolean;
    };
}

function toCanvasEvent(
    e: MouseEvent,
    rect: DOMRect,
    startX: number,
    startY: number,
    last: CanvasEvent = null,
): CanvasEvent {
    const delta = { x: 0, y: 0 };
    const start = { x: startX, y: startY };
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const canvasEvent: CanvasEvent = {
        x: offsetX,
        y: offsetY,
        delta,
        start,
        keys: {
            shift: e.shiftKey,
            cmd: e.metaKey || e.ctrlKey,
            alt: e.altKey,
        },
    };
    if (last) {
        delta.x = offsetX - last.x;
        delta.y = offsetY - last.y;
    }
    return canvasEvent;
}

export function initEvents(
    canvas: HTMLCanvasElement,
    onDragStart: (_e: CanvasEvent) => void,
    onDragMove: (_e: CanvasEvent) => void,
    onDragEnd: (_e: CanvasEvent) => void,
    onClick: (_e: CanvasEvent) => void,
    onDblClick: (_e: CanvasEvent) => void,
    onMouseMove: (_e: CanvasEvent) => void,
    onMouseOut: (_e: CanvasEvent) => void,
) {
    let startX = -Infinity;
    let startY = -Infinity;
    let isDragging = false;
    let last: CanvasEvent | null = null;
    let rect: DOMRect | null = null;
    const mouseOutHandler = (e) => onMouseOut(toCanvasEvent(e, rect, startX, startY));

    const mouseDownHandler = (e: MouseEvent) => {
        rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        isDragging = false;
        last = toCanvasEvent(e, rect, startX, startY);
        document.addEventListener('mouseup', mouseUpHandler);
        document.addEventListener('mouseout', mouseOutHandler);
    };

    const mouseMoveHandler = (e: MouseEvent) => {
        if (!rect) rect = canvas.getBoundingClientRect();

        const a = { x: startX, y: startY };
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const b = { x: offsetX, y: offsetY };

        if (!last) {
            onMouseMove(toCanvasEvent(e, rect, startX, startY, last));
            return;
        }

        if (isFarEnough(a, b) && !isDragging) {
            isDragging = true;
            onDragStart(last);
        }

        if (isDragging) {
            onDragMove(toCanvasEvent(e, rect, startX, startY, last));
            onMouseMove(toCanvasEvent(e, rect, startX, startY, last));
            last = toCanvasEvent(e, rect, startX, startY);
        }
    };

    const mouseUpHandler = (e: MouseEvent) => {
        if (!isDragging) onClick(toCanvasEvent(e, rect, startX, startY));
        else onDragEnd(toCanvasEvent(e, rect, startX, startY, last));

        startX = startY = -Infinity;
        isDragging = false;
        last = null;

        document.removeEventListener('mouseup', mouseUpHandler);
        document.removeEventListener('mouseout', mouseOutHandler);
    };

    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    canvas.addEventListener('dblclick', (e) => {
        onDblClick(toCanvasEvent(e, rect, startX, startY));
    });
}

export function initKeyEvents(context: PathEditorContext) {
    const { canvas } = context;
    const hotKeys = new Hotkeys();
    hotKeys.init(createKeyMap(context));
    canvas.addEventListener('keydown', (e) => {
        if (hotKeys.fire(e) !== false) e.preventDefault();
    });
    canvas.focus();
}

function createKeyMap(context: PathEditorContext) {
    return {
        'esc,enter'() {
            context.editor.currentElement.$editing = false;
        },
        'ctrl+a, command+a'() {
            if (context.state.isLiteTool) {
                context.currentPath.anchors.forEach((_, i) => {
                    context.currentPath.pickAnchor(i);
                });
                context.render();
            }
        },
        tab() {
            if (context.state.isLiteTool) {
                const { pickedAnchors, anchors } = context.currentPath;
                let index = 0;
                if (pickedAnchors.size === 1) {
                    index = pickedAnchors.values().next().value + 1;
                    if (index >= anchors.length) index = 0;
                }
                pickedAnchors.clear();
                context.currentPath.pickAnchor(index);
                context.render();
            }
        },
        'delete, backspace'() {
            if (context.state.isLiteTool) {
                context.liteTool.removeAnchor();
                context.undoManager.makeSnapshot();
            }
        },
        'ctrl+z, command+z'() {
            if (context.state.isLiteTool) {
                context.undoManager.undo();
            }
        },
        'ctrl+shift+z, command+shift+z'() {
            if (context.state.isLiteTool) {
                context.undoManager.redo();
            }
        },
    };
}
