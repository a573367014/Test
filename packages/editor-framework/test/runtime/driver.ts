import {
    IVPEditor,
    ElementModel,
    ILayoutModel,
    IGroupElementModel,
    ITempletModel,
    IEditorDelegate,
} from '../../src/types/editor';
import { assertValidTemplet } from '../specs/collab-utils';
import { DriverConsts as D, ROTATE_ICON_OFFSET, IS_CYPRESS } from './consts';

type DraggableElement =
    | D.TopElement
    | D.BottomElement
    | D.FirstElement
    | D.LastElement
    | D.CurrentElement;
type Draggable = D.Layout | DraggableElement;
type Position =
    | D.Center
    | D.Left
    | D.TopLeft
    | D.Top
    | D.TopRight
    | D.Right
    | D.BottomRight
    | D.Bottom
    | D.BottomLeft;

interface IPoint {
    x: number;
    y: number;
}

type EditorCoord = IPoint;
type DOMCoord = IPoint;

interface IRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

function getCenter(r: IRect): IPoint {
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function toRad(degree: number) {
    return (degree / 180) * Math.PI;
}

function wait(ms?: number): Promise<void> {
    if (typeof ms === 'number') {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    } else {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    }
}

function mockMouseEvent(name: string, x: number, y: number) {
    const event = new MouseEvent(name, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
    });
    return event;
}

function isDraggableElement(target: D): target is DraggableElement {
    return (
        target === D.TopElement ||
        target === D.BottomElement ||
        target === D.FirstElement ||
        target === D.LastElement ||
        target === D.CurrentElement
    );
}

function isLayout(target: D): target is D.Layout {
    return target === D.Layout;
}

async function simulateClick(x: number, y: number) {
    const eventTarget = document.elementFromPoint(x, y);
    const mouseDownEvent = mockMouseEvent('mousedown', x, y);
    const mouseMoveEvent = mockMouseEvent('mousemove', x, y);
    const mouseUpEvent = mockMouseEvent('mouseup', x, y);
    const clickEvent = mockMouseEvent('click', x, y);

    eventTarget.dispatchEvent(mouseDownEvent);
    await wait();
    eventTarget.dispatchEvent(mouseMoveEvent);
    await wait();
    eventTarget.dispatchEvent(mouseUpEvent);
    await wait();
    eventTarget.dispatchEvent(clickEvent);
    await wait();
}

async function simulateDoubleClick(x: number, y: number) {
    const eventTarget = document.elementFromPoint(x, y);
    const mouseDownEvent = mockMouseEvent('mousedown', x, y);
    const mouseMoveEvent = mockMouseEvent('mousemove', x, y);
    const mouseUpEvent = mockMouseEvent('mouseup', x, y);
    const clickEvent = mockMouseEvent('click', x, y);
    const doubleClickEvent = mockMouseEvent('dblclick', x, y);

    eventTarget.dispatchEvent(mouseDownEvent);
    await wait();
    eventTarget.dispatchEvent(mouseMoveEvent);
    await wait();
    eventTarget.dispatchEvent(mouseUpEvent);
    await wait();

    eventTarget.dispatchEvent(clickEvent);
    await wait();

    eventTarget.dispatchEvent(mouseDownEvent);
    await wait();
    eventTarget.dispatchEvent(mouseMoveEvent);
    await wait();
    eventTarget.dispatchEvent(mouseUpEvent);
    await wait();

    eventTarget.dispatchEvent(doubleClickEvent);
    await wait();
}

async function simulateDrag(coords: DOMCoord[]) {
    await wait(60);
    const first = coords[0];
    const last = coords[coords.length - 1];

    const mouseDownEvent = mockMouseEvent('mousedown', first.x, first.y);
    const mouseUpEvent = mockMouseEvent('mouseup', last.x, last.y);
    // 模拟事件若触发在 shell 或 container 层，即便坐标正确也无法触发内层子节点事件回调
    // 故首次 mousedown 需触发在可见的最上层 DOM 叶子节点上
    const mouseDownTarget = document.elementFromPoint(first.x, first.y);
    mouseDownTarget.dispatchEvent(mouseDownEvent);
    await wait(60);

    for (const coord of coords) {
        const mouseMoveEvent = mockMouseEvent('mousemove', coord.x, coord.y);
        document.dispatchEvent(mouseMoveEvent);
        await wait(60);
    }

    document.dispatchEvent(mouseUpEvent);
    await wait(60);
}

async function simulateSingleDrag(baseX: number, baseY: number, dX: number, dY: number) {
    const coords: DOMCoord[] = [
        { x: baseX, y: baseY },
        { x: baseX + dX, y: baseY + dY },
    ];
    await simulateDrag(coords);
}

async function simulateRotateDrag(center: DOMCoord, radius: number, degree: number) {
    const halfDegree = degree / 2;
    const halfRad = toRad(halfDegree);
    const fullRad = toRad(degree);

    const coords: DOMCoord[] = [
        { x: center.x, y: center.y + radius },
        {
            x: center.x + Math.sin(halfRad) * radius,
            y: center.y + Math.cos(halfRad) * radius,
        },
        {
            x: center.x + Math.sin(fullRad) * radius,
            y: center.y + Math.cos(fullRad) * radius,
        },
    ];
    await simulateDrag(coords);
}

async function waitElement(editor: IVPEditor, element: ElementModel): Promise<void> {
    const { uuid } = element;

    return new Promise(async (resolve) => {
        if (element.$loaded) {
            resolve();
            return;
        }

        if (element.type === 'group') {
            await Promise.all(element.elements.map((el) => waitElement(editor, el)));
            resolve();
            return;
        }

        const onLoaded = (element: ElementModel) => {
            if (element.uuid !== uuid) return;

            editor.$events.$off('element.loadError', onLoadError);
            resolve();
        };
        const onLoadError = (_: Error, element: ElementModel) => {
            if (element.uuid !== uuid) return;

            editor.$events.$off('element.loaded', onLoaded);
            resolve(); // 不 reject 未完成加载的元素
        };

        editor.$events.$on('element.loaded', onLoaded);
        editor.$events.$on('element.loadError', onLoadError);
    });
}

export class EditorDriver implements IEditorDelegate {
    editors: IVPEditor[] = [];
    private _containerRect: DOMRect;
    private _shellRect: DOMRect;
    private _index = 0;

    constructor(editors: IVPEditor[]) {
        this.editors = editors;
        // @ts-ignore
        window.user = this;
    }

    get editor() {
        return this.editors[this._index];
    }

    editorAt(i: number): IVPEditor {
        return this.editors[i];
    }

    private get _zoom() {
        return this.editor.global.zoom;
    }

    private get _bottomElement() {
        return this.editor.currentLayout.elements[0];
    }

    private get _topElement() {
        const index = this.editor.currentLayout.elements.length;
        return this.editor.currentLayout.elements[index - 1];
    }

    private get _container(): HTMLDivElement {
        return this.editor.$el;
    }

    private get _shell(): HTMLDivElement {
        return this._container.querySelector('.editor-shell');
    }

    private _updateEditorRects() {
        this._containerRect = this._container.getBoundingClientRect();
        this._shellRect = this._shell.getBoundingClientRect();
    }

    // DOM 坐标转编辑器坐标
    private _toEditorCoord(x: number, y: number): EditorCoord {
        this._updateEditorRects();
        const { _containerRect, _shellRect } = this;

        const offsetX = _containerRect.left + _shellRect.left;
        const offsetY = _containerRect.top + _shellRect.top;
        return {
            x: (x - offsetX) / this._zoom,
            y: (y - offsetY) / this._zoom,
        };
    }

    // 编辑器坐标转 DOM 坐标
    // 为避免高频获取 DOMRect，使用前需先手动 updateEditorRects
    private _toDOMCoord(x: number, y: number): DOMCoord {
        this._updateEditorRects();
        const { _containerRect, _shellRect } = this;

        const offsetX = _shellRect.left;
        const offsetY = _shellRect.top;

        return {
            x: x * this._zoom + offsetX,
            y: y * this._zoom + offsetY,
        };
    }

    private _getDOMCoord(target: Draggable, position: Position): DOMCoord {
        let rect: IRect = { left: 0, top: 0, width: 0, height: 0 };
        if (isDraggableElement(target)) {
            const element = this._getElement(target);
            rect = element;
        } else if (isLayout(target)) {
            const { currentLayout } = this.editor;
            rect.width = currentLayout.width;
            rect.height = currentLayout.height;
        }
        const center = getCenter(rect);
        const right = rect.left + rect.width;
        const bottom = rect.top + rect.height;

        switch (position) {
            case D.Center:
                return this._toDOMCoord(center.x, center.y);
            case D.Left:
                return this._toDOMCoord(rect.left, center.y);
            case D.TopLeft:
                return this._toDOMCoord(rect.left, rect.top);
            case D.Top:
                return this._toDOMCoord(center.x, rect.top);
            case D.TopRight:
                return this._toDOMCoord(right, rect.top);
            case D.Right:
                return this._toDOMCoord(right, center.y);
            case D.BottomRight:
                return this._toDOMCoord(right, bottom);
            case D.Bottom:
                return this._toDOMCoord(center.x, bottom);
            case D.BottomLeft:
                return this._toDOMCoord(rect.left, bottom);
        }

        console.error('无效的 target / position 组合', target, position);
    }

    private _getElement(target: DraggableElement) {
        switch (target) {
            case D.TopElement:
            case D.LastElement:
                return this._topElement;
            case D.BottomElement:
            case D.FirstElement:
                return this._bottomElement;
            case D.CurrentElement:
                return this.editor.currentElement;
        }
        console.error('无效的 target 类型', target);
    }

    /**
     * editor.currentElement 的捷径
     */
    get currentElement() {
        return this.editor.currentElement;
    }

    /**
     * editor.currentLayout 的捷径
     */
    get currentLayout() {
        return this.editor.currentLayout;
    }

    async setTemplet(templet: Partial<ITempletModel>) {
        await this.editor.setTemplet(templet);
    }

    async markOperation(msg = '') {
        this.editor.$binding.undoMgr.stopCapturing();
        await this.wait();
        assertValidTemplet(this.editor, msg);
    }

    async addElement(
        props: Partial<ElementModel>,
        parent?: ILayoutModel | IGroupElementModel,
        index?: number,
    ): Promise<ElementModel> {
        const element = this.editor.addElement(props, parent, index);
        await waitElement(this.editor, element);
        return element;
    }

    changeElement(props: Partial<ElementModel>, elements: ElementModel | ElementModel[]) {
        this.editor.changeElement(props, elements);
    }

    removeElement(
        elements: ElementModel | ElementModel[],
        parent: ILayoutModel | IGroupElementModel,
    ) {
        return this.editor.removeElement(elements, parent);
    }

    async addGroupByElements() {
        const group = this.editor.addGroupByElements();
        await waitElement(this.editor, group);
        return group;
    }

    /**
     * 基于定位获取用于拖拽等操作的坐标，坐标为编辑器坐标系
     */
    coord(target: Draggable, position: Position = D.Center, offsetX = 0, offsetY = 0): EditorCoord {
        const { _zoom } = this;
        const baseDOMCoord = this._getDOMCoord(target, position);
        const targetDOMCoord = {
            x: baseDOMCoord.x + offsetX / _zoom,
            y: baseDOMCoord.y + offsetY / _zoom,
        };
        return this._toEditorCoord(targetDOMCoord.x, targetDOMCoord.y);
    }

    /**
     * 模拟点选操作，默认选中目标中心
     */
    async click(target: Draggable, position: Position = D.Center) {
        const { x, y } = this._getDOMCoord(target, position);
        await simulateClick(x, y);
    }

    /**
     * 模拟在单个坐标位置的点选操作，坐标为编辑器坐标系
     */
    async clickCoord(x: number, y: number) {
        const domCoord = this._toDOMCoord(x, y);
        await simulateClick(domCoord.x, domCoord.y);
    }

    /**
     * 使用点击穿透 模拟在单个坐标位置的点选操作，坐标为编辑器坐标系
     */
    async clickCoord2(coord: EditorCoord) {
        const layer = this.editor.$picker.pick(coord.x, coord.y);
        this.editor.currentElement =
            layer && layer.$element && !layer.$element.$editing ? layer.$element : null;
    }

    /**
     * 模拟双击操作，默认选中目标中心
     */
    async doubleClick(target: Draggable, position: Position = D.Center) {
        const { x, y } = this._getDOMCoord(target, position);
        await simulateDoubleClick(x, y);
    }

    /**
     * 模拟在单个坐标位置的双击操作，坐标为编辑器坐标系
     */
    async doubleClickCoord(x: number, y: number) {
        const domCoord = this._toDOMCoord(x, y);
        await simulateDoubleClick(domCoord.x, domCoord.y);
    }

    /**
     * 模拟相对于元素位置的拖拽操作，坐标为编辑器坐标系
     */
    async drag(target: DraggableElement, position: Position, dX: number, dY: number) {
        const { _zoom } = this;
        const { x, y } = this._getDOMCoord(target, position);
        await simulateSingleDrag(x, y, dX * _zoom, dY * _zoom);
    }

    /**
     * 模拟沿一系列坐标的拖拽操作，坐标为编辑器坐标系
     */
    async dragCoords(coords: EditorCoord[]) {
        this._updateEditorRects();

        const domCoords = coords.map((coord) => this._toDOMCoord(coord.x, coord.y));
        await simulateDrag(domCoords);
    }

    /**
     * 模拟沿一系列坐标的拖拽操作，坐标为编辑器坐标系
     */
    getCoordBySelector(selector: string): IPoint {
        const rect = this.editor.$el.querySelector(selector).getBoundingClientRect();
        const point = this.editor.pointFromEvent({
            pageX: rect.x + rect.width / 2,
            pageY: rect.y + +rect.height / 2,
        } as MouseEvent);

        return point;
    }

    /**
     * 模拟相对于元素中心的旋转操作
     */
    async rotate(target: DraggableElement, degree: number) {
        const { _zoom } = this;
        const element = this._getElement(target);
        const center = getCenter(element);
        const domCenter = this._toDOMCoord(center.x, center.y);
        // 竖直向下寻找旋转控件，故暂不支持对已旋转元素的操作
        const domRadius = (element.height / 2) * _zoom + ROTATE_ICON_OFFSET;

        // 编辑器规定顺时针为正向，但笛卡尔坐标系沿逆时针自增，故取反
        await simulateRotateDrag(domCenter, domRadius, -degree);
    }

    async type(input: string): Promise<void> {
        return new Promise((resolve) => {
            if (IS_CYPRESS) cy.type(input);
            resolve();
        });
    }

    /**
     * 模拟等待操作，若不指定时间则等待至下一个 animation frame
     */
    async wait(ms?: number): Promise<void> {
        await wait(ms);
    }

    setIndex(i) {
        this._index = i;
    }
}
