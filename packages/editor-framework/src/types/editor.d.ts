/* eslint-disable no-unused-vars */
import type { YBinding } from '../base/y-model/binding';
import * as Y from '@gaoding/yjs';
import { BaseService } from '../src/base/service';
import CursorController from '@gaoding/editor-utils/cursor-controller';
import type { Effect, EffectFilling, EffectShadow, GradientFilling } from './effect';

type UID = string;

interface ITempletModel {
    type: 'poster';
    version?: string;
    global: IEditorGlobal;
    layouts: Partial<ILayoutModel>[];
}

interface IEditorGlobal {
    dpi: number;
    layout: Object;
    unit: string;
    zoom: number;
}

interface ILayoutModel {
    uuid: UID;
    $index: number;
    background: { color: string };
    backgroundColor: string;
    background: {
        color: string;
    };
    title: string;
    width: number;
    height: number;
    elements: ElementModel[];
    top?: number;
}

interface ITransform {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
    localTransform: ITransform;
    scale: {
        x: number;
        y: number;
    };
    rotation: number;
    skew: {
        x: number;
        y: number;
    };
    toJSON: () => ITransform;
}

interface IBackgroundEffect {
    image: {
        transform: ITransform;
    };
}

interface IBorder {
    enable: boolean;
    type: 'image' | 'color';
    opacity: number;
    width: number;
    direction: number[];
    image: string;
    imageRepeat: 'repeat' | 'round';
    imageSlice: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    color: string;
}

interface IBoxShadow {
    offsetX: number;
    offsetY: number;
    blurRadius: number;
    spreadRadius: number;
    color: string;
}

interface IBaseElementModel {
    type: string;
    uuid: UID;
    version: string;

    $parentId: UID;
    $id: UID;
    $cacheParentId: UID;
    $tempGroupId: UID;
    $renderId: UID;
    $fallbackId: UID;
    $index: number;
    $loaded: boolean;
    $editing: boolean;
    // 拦截元素内部 watch 逻辑
    $resizeApi?: boolean;

    left: number;
    top: number;
    width: number;
    height: number;
    transform: ITransform;
    rotate: number;
    resize: number;

    backgroundEffect: IBackgroundEffect;
    backgroundColor: string;
    border: IBorder;
    boxShadow: IBoxShadow;

    // 业务
    category: string;
    linkId: UID;

    // 状态控制
    dragable: boolean;
    editable: boolean;
    rotatable: boolean;
    frozen: boolean;
    lock: boolean;
    hidden: boolean;
    opacity: number;
    imageUrl: string;
    effectedResult?: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
}

interface ITextContentProp {
    color: string;
    content: string;
    fontFamily: string;
    fontSize: number;
    fontStyle: string;
    fontWeight: number;
    textDecoration: string;
}

interface ITextElementModel extends IBaseElementModel {
    type: 'text';
    autoScale: boolean;
    content: string;
    contents: Partial<ITextContentProp>[];
    color: string;
    fontFamily: string;
    fontSize: number;
    fontStyle: string;
    fontWeight: string | number;
    letterSpacing: number;
    textAlign: string;
    verticalAlign: string;
    writingMode: string;
    textDecoration: string;
    lineHeight: number;
    textEffects: Effect[];
    shadows: EffectShadow[];
}

interface ISVGColors {
    [key: string]: string;
}

interface ISvgElementModel extends IBaseElementModel {
    type: 'svg';
    content: string;
    colors: ISVGColors;
    url: string;
}

interface IImageLike {
    url: string;
    imageUrl: string;
    naturalWidth: number;
    naturalHeight: number;
    imageTransform: ITransform;
}

interface IImageElementModel extends IBaseElementModel, IImageLike {
    type: 'image';
    imageEffects: Effect[];
}

interface IMaskElementModel extends IBaseElementModel, IImageLike {
    type: 'mask';
    mask: string;
}

/**
 * 渐变 stop 单位
 */
interface IPathEffect {
    type: 'base' | 'brush' | 'image';
    enable: boolean;
    fillColor?: string; // 闭合区域填充颜色
    color: string; // 线条填充颜色
    width: number; // 线条宽度
    lineType: IPathStrokeType;
    join?: 'miter' | 'round' | 'bevel'; // 拐角连接(默认miter)
    filling?: EffectFilling;
}

type IPathStrokeType = 'inner' | 'outer' | 'center';

interface IPathStroke {
    type: IPathStrokeType;
    width: number;
    color: string;
    enable: boolean;
}

interface IPathElementModel extends IBaseElementModel {
    type: 'path';
    path: string;
    pathShape:
        | 'brush'
        | 'arrow_brush'
        | 'rect'
        | 'ellipse'
        | 'rect_focus'
        | 'ellipse_focus'
        | 'arrow'
        | 'line'
        | 'triangle'
        | 'pen';
    radius: number;
    pathEffects: IPathEffect[];

    $currentPathEffect: IPathEffect;
    $fillColor: GradientFilling | string | null;
    $lookLike: 'rect' | 'ellipse' | 'line' | 'triangle';
    isLine(): boolean;
    isRect(): boolean;
}

interface IGroupElementModel extends IBaseElementModel {
    type: 'group' | 'flex' | '$selector';
    elements: ElementModel[];
    splitenable: boolean;
    autoGrow: boolean;
}

type ElementModel =
    | ITextElementModel
    | ISvgElementModel
    | IImageElementModel
    | IMaskElementModel
    | IPathElementModel
    | IGroupElementModel;
interface IEditorInnerEventTypes {
    'element.loaded': (element: ElementModel) => void;
    'element.loadError': (err: Error, element: ElementModel) => void;
    'element.rectUpdate': (elment: ElementModel, delta: { width: number; height: number }) => void;
    'base.remoteUpdate': () => void;
    'path.dragMove': (e) => void;
    'path.dragEnd': () => void;
    'base.changeCursor': () => void;
}

interface IEditorEventTypes {
    templetCreated: () => void;
    templetLoaded: () => void;
    layoutLoaded: (layout: ILayoutModel) => void;
}

interface IEditorEventEmitter {
    $on<T extends keyof IEditorInnerEventTypes>(name: T, handler: IEditorInnerEventTypes[T]): void;
    $once<T extends keyof IEditorInnerEventTypes>(
        name: T,
        handler: IEditorInnerEventTypes[T],
    ): void;
    $off<T extends keyof IEditorInnerEventTypes>(name: T, handler: IEditorInnerEventTypes[T]): void;
    $emit<T extends keyof IEditorInnerEventTypes>(
        name: T,
        ...args: Parameters<IEditorInnerEventTypes[T]>
    ): void;
    dispatchMouseEvent: boolean;
}
interface IVPEditor {
    _uid: number;
    global: IEditorGlobal;
    mode: 'design' | 'preview' | 'flow' | 'mirror';
    options: {
        snapshotable: boolean;
        resource: {
            blobUrlEnable: boolean;
            upload(blob: Blob, element: ElementModel | ILayoutModel, key: string): Promise<string>;
        };
        collabOptions: {
            doc: unknown;
            setTempletHook(templet: ITempletModel): Promise<any>;
        };
        captureErrorHook?: (error: Error, msg: string, action?: any) => void;
    };
    innerProps: {
        snapshotable: boolean;
    };
    innerProps: {
        snapshotable: boolean;
    };
    layouts: ILayoutModel[];
    currentLayout: ILayoutModel;
    currentElement: ElementModel;
    currentSubElement: ElementModel;
    zoom: number;

    services: {
        load(type: string): Promise<BaseService>;
        cache: Map<string, BaseService>;
    };

    shellRect: {
        left: number;
        top: number;
        width: number;
        height: number;
    };

    hotkeys: {
        getPressedKeyCodes(): number[];
    };

    cursorController: CursorController;

    $el: HTMLDivElement;
    $events: IEditorEventEmitter;
    $binding: YBinding;
    $refs: {
        transform: {
            visible: boolean;
        };
        tempGroup: any;
        container?: HTMLDivElement;
    };

    $on<T extends keyof IEditorEventTypes>(name: T, handler: IEditorEventTypes[T]): void;
    $off<T extends keyof IEditorEventTypes>(name: T, handler: IEditorEventTypes[T]): void;

    $emit<T extends keyof IEditorEventTypes>(
        name: T,
        ...args: Parameters<IEditorEventTypes[T]>
    ): void;
    $nextTick(callback?: () => void): Promise<void>;

    isGroup(element: ElementModel): boolean;
    setTemplet(
        templet: Partial<ITempletModel>,
        defaultIndex?: number,
        fromRemote?: boolean,
    ): Promise<void>;
    zoomTo(val: number): void;
    addLayout(layout: ILayoutModel, index?: number): ILayoutModel;
    changeLayout(
        props: Partial<ILayoutModel>,
        layouts: ILayoutModel | ILayoutModel[],
        sync?: boolean,
    ): void;
    removeLayout(layout: ILayoutModel | number, currentLayoutIndex?: number): void;
    toggleLayout(layout: ILayoutModel | number): void;
    switchLayout(layoutA: ILayoutModel | number, layoutB: ILayoutModel | number): void;
    shiftLayout(layout: ILayoutModel, index: number): void;
    createElement(props: Partial<ElementModel>, layout?: ILayoutModel);
    addElement(
        props: Partial<ElementModel>,
        parent?: ILayoutModel | IGroupElementModel,
        index?: number,
    ): ElementModel;
    changeElement(
        props: Partial<ElementModel>,
        elements: ElementModel | ElementModel[],
        makeSnapshot?: boolean,
    ): void;
    shallowChangeElement(
        props: Partial<ElementModel>,
        elements?: ElementModel | ElementModel[],
        makeSnapshot?: boolean,
    ): void;
    removeElement(
        elements: ElementModel | ElementModel[],
        parent?: ILayoutModel | IGroupElementModel,
        makeSnapshot?: boolean,
    ): ElementModel[];
    copyElement(elemnts: ElementModel | ElementModel[], toClipboard?: boolean): ElementModel[];
    getElement(
        id: UID,
        options?: { deep?: boolean; layouts?: (ILayoutModel | IGroupElementModel)[] },
    ): ElementModel;
    focusElement(element: ElementModel): void;
    goElementIndex(elements: ElementModel | ElementModel[], step: number): void;
    addText(text: string, props: Partial<ElementModel>);
    addGroupByElements(
        elements?: ElementModel[],
        options?: Partial<IGroupElementModel>,
        deep?: boolean,
    ): IGroupElementModel;
    addFlexByElements(): void;
    flatGroup(): void;
    createGroup(elements: ElementModel[], deep?: boolean): IGroupElementModel;
    createTempGroup(element?: ElementModel): void;
    cancelTempGroup(): void;
    walkTemplet(
        callback: (element: ElementModel) => void,
        deep: boolean,
        layouts: Partial<ILayoutModel>[],
    ): void;
    makeSnapshot(action: Object): void;
    makeSnapshotByElement(element: ElementModel): void;
    changeGlobal(props: Partial<IEditorGlobal>): void;
    updateContainerRect(): void;
    fitZoom(): void;
    getLayout(layout: ILayoutModel | string): ILayoutModel;
    resetAggregatedColors(element: ElementModel, makeSnapshot: boolean);
    undo(): void;
    redo(): void;
    /**
     * 将鼠标位置转换成编辑器的坐标
     * @param e 鼠标事件
     */
    pointFromEvent(e: MouseEvent): { x: number; y: number };
    replaceElement(oldElement: ElementModel, newElement: ElementModel);
    changeTextContents(
        props: Partial<ITextElementModel>,
        elements: ITextElementModel | ITextElementModel[],
    ): void;
    convertImageToMask(element: IImageElementModel): IMaskElementModel;
    resetTemplet(fromRemote: boolean): void;
    replaceLayout(oldLayout: ILayoutModel, newLayout: Partial<ILayoutModel>): ILayoutModel;
    createAsyncComponent({ type: string }): Promise<void>;
    exportImage(
        layout?: ILayoutModel,
        strategy = {},
        timeout = 10000,
        isRenderWatermark = false,
        isUseSvgExport = false,
        isRenderGlobalBg = true,
    ): Promise<HTMLCanvasElement>;
    showElementEditor(element: ElementModel);
}

interface IEditorDelegate {
    setTemplet(templet: Partial<ITempletModel>): Promise<void>;
    addElement(
        props: Partial<ElementModel>,
        parent?: ILayoutModel | IGroupElementModel,
        index?: number,
    ): Promise<ElementModel>;
    changeElement(props: Partial<ElementModel>, elements: ElementModel | ElementModel[]): void;
    removeElement(
        elements: ElementModel | ElementModel[],
        parent: ILayoutModel | IGroupElementModel,
    ): ElementModel[];
    addGroupByElements(): Promise<IGroupElementModel>;
}

interface IAddLayoutAction {
    tag: 'add_layout';
    layout: ILayoutModel;
    fromRemote: boolean;
}

interface IChangeLayoutAction {
    tag: 'change_layout';
    layouts: ILayoutModel[];
    props: Partial<ILayoutModel>;
}

interface IRemoveLayoutAction {
    tag: 'remove_layout';
    layout: ILayoutModel;
}

interface ISwapLayoutAction {
    tag: 'swap_layout';
    layoutA: ILayoutModel;
    layoutB: ILayoutModel;
}

interface IAddElementAction {
    tag: 'add_element';
    parent: ILayoutModel | IGroupElementModel;
    element: ElementModel;
}

interface IChangeElementAction {
    tag: 'change_element';
    elements: ElementModel[];
    deep: boolean;
}

interface IRemoveElementAction {
    tag: 'remove_element';
    elements: ElementModel[];
}

interface IReorderElementAction {
    tag: 'reorder_element';
    index: number;
    elements: ElementModel[];
    parent: ILayoutModel | IGroupElementModel;
}
interface IAddGroupAction {
    tag: 'add_group';
    group: IGroupElementModel;
    layout: ILayoutModel;
}
interface IFlatGroupAction {
    tag: 'flat_group';
    removedChildren: IGroupElementModel[];
    group: IGroupElementModel;
    parent: ILayoutModel | IGroupElementModel;
    index: number;
}

interface ICancelTempGroupAction {
    tag: 'cancel_temp_group';
    group: IGroupElementModel;
    index: number;
}

interface IChangeGlobalAction {
    tag: 'change_global';
    props: Partial<IEditorGlobal>;
}

interface ISetTempletAction {
    tag: 'set_templet';
    layouts: ILayoutModel[];
    global: IEditorGlobal;
}

type VPEAction =
    | IReorderElementAction
    | IAddLayoutAction
    | IChangeLayoutAction
    | IRemoveLayoutAction
    | ISwapLayoutAction
    | IAddElementAction
    | IChangeElementAction
    | IRemoveElementAction
    | IAddGroupAction
    | IFlatGroupAction
    | ICancelTempGroupAction
    | IChangeGlobalAction
    | ISetTempletAction;

interface ActionLog {
    tag: string;
    time: string;
    uuids: UID[];
}
