/**
 * @class EditorMiscMixin
 * @description 编辑器不知道放哪的属性方法
 */

import $ from '@gaoding/editor-utils/zepto';

import { cloneDeep, assign, throttle, merge, pick, get } from 'lodash';
import { Hotkeys, handleMap } from '@gaoding/editor-utils/hotkeys';
import pickImage from '@gaoding/editor-utils/pick-image';
import pickFile from '@gaoding/editor-utils/pick-file';
import loader from '@gaoding/editor-utils/loader';
import isHotKey from 'is-hotkey';
import editorDefaults from '../editor-defaults';
import utils, { version } from '../../utils/utils';
import DropFile from '../../utils/drop-file';
import PasteImage from '../../utils/paste-image';
import { correctImageOrientation } from '@gaoding/editor-utils/correct-image-orientation';
import { adjustPasteElementPosition } from '../../utils/paste';
import { loadFontsSubset } from '../../utils/subset';
import { compatibleEvent } from '../../utils/dom-event';
import CursorController from '@gaoding/editor-utils/cursor-controller';
import { getAnimations } from '../../utils/element-animation';

export default {
    /**
     * 选择用户本地图片，工具方法
     * @memberof EditorMiscMixin
     * @param {Function} callback - 获取到的图片，callback 执行环境为返回的图片对象，参数为图片
     * @param {Function} [afterSelect] - 选择图片后回调函数，得到图片前执行
     * @returns {Promise} HTMLImageElement
     */
    pickImage(callback, afterSelect) {
        return pickImage()
            .then((file) => {
                return correctImageOrientation(file);
            })
            .then((file) => {
                // After select a file
                if (afterSelect) {
                    afterSelect(file);
                }

                if (this.options.resource.blobUrlEnable) {
                    return URL.createObjectURL(file);
                }
                return loader.readFile(file, 'DataURL');
            })
            .then((url) => {
                return loader.loadImage(url);
            })
            .then((img) => {
                callback.call(this, img, img.src);

                return img;
            })
            .catch((err) => {
                console.error('Image file load error:', err.stack);
            });
    },

    /**
     * 选择用户本地视频，工具方法
     * @memberof EditorMiscMixin
     * @param {Function} callback - 获取到的视频，callback 执行环境为返回的视频对象，参数为视频 url
     * @param {Function} [afterSelect] - 选择视频后回调函数，得到视频前执行
     * @returns {Promise} HTMLVideoElement
     */
    pickVideo(callback, afterSelect) {
        return pickFile({ accept: 'video/mp4' })
            .then((file) => {
                // After select a file
                if (afterSelect) {
                    afterSelect(file);
                }

                /**
                 * ⚠️ 这个 url 需要在没用的时候, 手动释放
                 */
                return URL.createObjectURL(file);
            })
            .then((url) => {
                return loader.loadVideo(url);
            })
            .then((video) => {
                callback.call(this, video, video.src);

                return video;
            })
            .catch((err) => {
                console.error('Image file load error:', err.stack);
                throw err;
            });
    },

    /**
     * 缩放编辑比例, 根据 point 为中心点缩放可视区域（默认视图中心）
     * @memberof EditorMiscMixin
     * @param {Number} zoom 缩放比例
     * @param {Point} point 缩放中心点
     */
    zoomTo(zoom, point) {
        const _preZoom = this.zoom;
        this.zoom = zoom;

        const changeOffset = {
            width: this.width * (this.zoom - _preZoom),
            height: this.height * (this.zoom - _preZoom),
        };

        const containerRect = this.containerRect;
        const shellRect = this.shellRect;

        if (!point) {
            point = {
                x: containerRect.width / 2,
                y: containerRect.height / 2,
            };
        }
        point._perX = point.x / containerRect.width;
        point._perY = point.y / containerRect.height;

        const leaveRight =
            changeOffset.width * (1 - point._perX) +
            (shellRect.width +
                containerRect.paddingLeftRight * 2 -
                (containerRect.width + containerRect.scrollLeft));

        const leaveBottom =
            changeOffset.height * (1 - point._perY) +
            (shellRect.height +
                containerRect.paddingTopBottom -
                (containerRect.height + containerRect.scrollTop));

        const scrollLeft = containerRect.scrollLeft;
        const scrollTop = containerRect.scrollTop;

        this.$events.$emit('base.beforeZoom');

        this.$nextTick(() => {
            this.container
                .scrollLeft(
                    scrollLeft +
                        changeOffset.width * point._perX -
                        (leaveRight < 0 ? leaveRight : 0),
                )
                .scrollTop(
                    scrollTop +
                        changeOffset.height * point._perY -
                        (leaveBottom < 0 ? leaveBottom : 0),
                );

            this.$events.$emit('base.zoom', zoom);
        });
    },

    calcFitZoom() {
        const layout = this.currentLayout;

        const layoutWidth = layout.width;
        const layoutHeight = layout.height;
        const containerRect = this.containerRect;
        const rectWidth = containerRect.width - containerRect.paddingLeftRight;
        const rectHeight = containerRect.height - containerRect.paddingTopBottom;

        if (layoutWidth <= 0 || layoutHeight <= 0 || rectWidth <= 0 || rectHeight <= 0) {
            return 1;
        }
        const heightRatio = layoutHeight / rectHeight;
        const widthRatio = layoutWidth / rectWidth;
        let ratio = widthRatio;

        if (heightRatio > ratio) {
            ratio = heightRatio;
        }
        return Math.min(this.options.autoFitMaxZoom, 1 / ratio);
    },

    /**
     * 根据窗口大小，自适应画布比例
     * @memberof EditorMiscMixin
     */
    fitZoom() {
        const layout = this.currentLayout;
        if (!layout || this.mode === 'mirror') {
            return;
        }
        let ratio = this.calcFitZoom();
        if (this.mode === 'flow') {
            const { width, containerRect, options } = this;
            const [padding] = options.padding;
            ratio = (containerRect.width - padding * 2) / width / 2;
        }
        this.zoomTo(ratio);
    },

    initRect() {
        this.updateRectThrottle = throttle(() => {
            // 可能在组件单测环境中已移除编辑器实例 DOM
            if (this.options.autoFitZoom && this.container !== null) {
                this.updateContainerRect();
            }
        }, 100);

        // size
        this.$watch('zoom', this.updateRectThrottle);
        this.$watch('width', this.updateRectThrottle);
        this.$watch('height', this.updateRectThrottle);

        // events
        this.$events.$on('base.resize', this.updateRectThrottle);
        this.$events.$on('base.scroll', this.updateRectThrottle);

        // first update
        this.updateRectThrottle();
    },

    /**
     * 更新编辑器容器 containerRect 尺寸相关数据
     * @memberof EditorMiscMixin
     */
    updateContainerRect() {
        const mode = this.mode;
        const container = this.container;
        const boundingRect = container[0].getBoundingClientRect();

        const shellHeight = this.height * this.zoom;
        const containerRect = this.containerRect;
        const padding = this.options.padding;

        containerRect.padding = padding;
        containerRect.paddingTopBottom = padding[0] + padding[2];
        containerRect.paddingLeftRight = padding[1] + padding[3];
        containerRect.paddingCss = padding.map((item) => item + 'px').join(' ');

        containerRect.scrollLeft = container.prop('scrollLeft');
        containerRect.scrollTop = container.prop('scrollTop');

        containerRect.scrollWidth = container[0].scrollWidth;
        containerRect.scrollHeight = container[0].scrollHeight;

        containerRect.height = boundingRect.height;
        containerRect.width = boundingRect.width;

        containerRect.left = boundingRect.left;
        containerRect.top = boundingRect.top;

        let offset = 0;
        if (mode !== 'mirror') {
            offset = boundingRect.height - shellHeight - containerRect.paddingTopBottom;
            offset = Math.max(0, offset);
        }

        containerRect.topOffset = offset / 2;

        // shell rect, delay for DOM update
        this.$nextTick(this.updateShellRect);
    },

    /**
     * 更新编辑器容器 shellRect 尺寸相关数据
     * @memberof EditorMiscMixin
     */
    updateShellRect() {
        const shellRect = this.shellRect;
        const containerRect = this.containerRect;
        const shell = $('.editor-shell', this.$el);

        if (shell.length) {
            const rect = shell[0].getBoundingClientRect();

            assign(shellRect, {
                height: rect.height,
                width: rect.width,
                top: rect.top - containerRect.top,
                left: rect.left - containerRect.left,
            });
        }

        return shellRect;
    },

    // 滚动编辑器容器
    scrollContainerRect(dragger = {}, zoom = 1) {
        const { dx = 0, dy = 0 } = dragger;
        const containerEl = this.$el;
        const { scrollLeft, scrollTop } = this.$el;
        // 会触发 scroll 事件
        containerEl.scrollLeft = scrollLeft - dx * zoom;
        containerEl.scrollTop = scrollTop - dy * zoom;
    },

    /**
     * 根据原生事件对象 event 返回 event 在编辑器的位置
     * @memberof EditorMiscMixin
     * @param {event} e 原生事件对象 event
     * @returns {Point} point 对象
     */
    pointFromEvent(e) {
        const zoom = this.zoom;
        const shellRect = this.shellRect;
        const containerRect = this.containerRect;
        const xOffset = containerRect.left + shellRect.left;
        const yOffset = containerRect.top + shellRect.top;
        const { pageX, pageY } = compatibleEvent(e);

        return {
            x: (pageX - xOffset) / zoom,
            y: (pageY - yOffset) / zoom,
        };
    },

    handleClick(e) {
        // 解决ios中双击可能会造成异常放大的bug
        e.preventDefault();
        // ignore editable element
        if (utils.isEditable(e.target)) {
            return;
        }

        let element;
        const point = this.pointFromEvent(e);
        const isMac = navigator.platform.indexOf('Mac') > -1;

        // focus 单个或多个元素
        if (e.shiftKey || (isMac ? e.metaKey : e.ctrlKey)) {
            // append selecteds
            element = this.getElementByPoint(point.x, point.y);
            if (element) {
                let currentElement = this.currentElement;
                // 阻止锁定元素多选操作
                if (currentElement && currentElement.lock) {
                    currentElement = null;
                }

                if (element === currentElement) {
                    this.unselectElement(element);
                    if (!this.selectedElements.length) {
                        this.currentElement = null;
                        this.currentTableRange = null;
                    }
                    return;
                } else {
                    this.selectElement(currentElement);
                }

                if (element.$selected) {
                    this.unselectElement(element);
                } else {
                    // Exclude locked element.
                    !element.lock && this.selectElement(element);
                }
            }
        } else {
            this.walkTemplet(
                (element) => {
                    element.$selected = false;
                },
                true,
                [this.currentLayout],
            );

            element = this.focusElementByPoint(point.x, point.y);

            if (!element) {
                this.currentElement = null;
            }
        }
        if (!element) {
            this.$events.$emit('base.clickOut', e);
        }
    },

    initDomEvents({ useNativeContextmenuEvent } = {}) {
        let doc = $(document);
        const container = this.container;

        this.hotkeys = new Hotkeys();
        this.cursorController = new CursorController(this);
        this.handleMap = handleMap;

        const bindHotkey = this.innerProps.options.bindHotkey;
        // 默认在 design 与 flow 时绑定热键
        const bindDefault = this.mode === 'design' || this.mode === 'flow';

        if (bindHotkey === true || (bindHotkey === null && bindDefault)) {
            this.enableHotkey();

            const onWheel = () => {
                if (this.hotkeys && this.hotkeys._disabled) return;
                const ua = window.navigator.userAgent.toLowerCase();
                const reduce = ua.includes('windows') && !ua.includes('firefox') ? 500 : 200;
                // const isMac = ua.includes('Mac');

                return (e) => {
                    if (!e.ctrlKey && !e.metaKey) return;
                    e.preventDefault();
                    e.stopPropagation();

                    const deltaY = e.deltaY || (e.detail > 0 ? 40 : -40);
                    const zoomScale = deltaY / reduce;
                    const zoom = this.zoom * (1 - (zoomScale / 2) * 0.4);
                    this.zoomTo(
                        Math.min(
                            this.options.mousewheelMaxZoom,
                            Math.max(this.options.mousewheelMinZoom, zoom),
                        ),
                    );

                    this.$nextTick(() => {
                        this.updateContainerRect();
                    });
                };
            };

            const clearCursorController = () => {
                throttled.cancel();
            };

            // 滚轮缩放快捷键绑定
            container[0].addEventListener('mousewheel', onWheel(), { passive: false });
            container[0].addEventListener('DOMMouseScroll', onWheel(), { passive: false });

            container[0].addEventListener('mouseleave', clearCursorController);
        }

        // 只有pc端开启监听双指移动，缩放画布事件
        this.options.touchEnable && this._initDomTouchEvent();

        // jQuery 监听相关 DOM 事件，后缀为可读性与后续 off 而添加
        doc.on('keydown.base', (e) => {
            const hotkeys = [
                'shift+down',
                'shift+left',
                'shift+right',
                'shift+up',
                'down',
                'left',
                'right',
                'up',
                'mod+c',
                'delete',
                'backspace',
                'mod+x',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                '0',
                'mod+g',
                'mod+shift+g',
                'mod+]',
                'mod+[',
                'mod+shift+]',
                'mod+shift+[',
            ];
            // broadcast event
            // 元素锁定时，部分快捷键不能使用
            if (this.currentElement && this.currentElement.lock && isHotKey(hotkeys, e)) {
                return;
            }
            this.$events.$emit('base.keyDown', e);

            // ignore event if prevented
            // ignore editable element
            if (e.isDefaultPrevented() || utils.isEditable(e.target)) {
                return;
            }

            // fire hotkey action
            if (
                this.editable &&
                this.hotkeys &&
                !this.hotkeys._disabled &&
                this.hotkeys.fire(e) === false
            ) {
                e.preventDefault();
            }
        });

        const addFromImageDom = (imageDom) => {
            const layout = this.currentLayout;

            if (layout) {
                const ratio = Math.max(
                    (imageDom.width / layout.width) * 2,
                    (imageDom.height / layout.height) * 2,
                    1,
                );

                const imageElement = this.addImage(imageDom.src, {
                    width: imageDom.width / ratio,
                    height: imageDom.height / ratio,
                });

                this.focusElement(imageElement);
            }
        };

        // 粘贴外部文字
        const pasteOuterText = (e) => {
            if (!e) return;

            let pasteText = e.clipboardData.getData('text');
            if (!pasteText || !pasteText.replace(/\r|\n/g, '')) {
                return;
            }

            // 删除尾部空格
            pasteText = pasteText.replace(/(\r|\n)+$/g, '');

            const element = this.addText(pasteText, { opacity: 0 });
            setTimeout(async () => {
                const layout = this.currentLayout;
                // 最大占 layout 宽高 60%
                const ratio = Math.min(
                    (layout.width * 0.6) / element.width,
                    (layout.height * 0.6) / element.height,
                );

                await this.resizeElements(element, ratio);
                element.left = (layout.width - element.width) / 2;
                element.top = (layout.height - element.height) / 2;
                adjustPasteElementPosition(element, layout);

                this.$refs.tempGroup && this.$refs.tempGroup.addSubElement(element, true);

                this.options.onPasteText && this.options.onPasteText(element);

                // 可见
                element.opacity = 1;

                this.focusElement(element);
            }, 50);
            return true;
        };

        // eslint-disable-next-line
        void new PasteImage(
            addFromImageDom.bind(this),
            // failCallback
            (e) => {
                !(this.pasteOuterElement && this.pasteOuterElement(e)) &&
                    !pasteOuterText(e) &&
                    this.pasteElement();
            },
            {
                beforeHook: (files) => {
                    return this.options.onPasteFile.call(this, files);
                },
                container: this.$el,
                editor: this,
            },
        );

        // eslint-disable-next-line
        void new DropFile(
            document.body,
            {
                dragover: (e) => e.preventDefault(),
                beforeDrop: (files) => this.options.onDropFile.call(this, files),
                drop: addFromImageDom.bind(this),
            },
            this.options.resource.blobUrlEnable,
        );

        // 派发 base.mouseDown / base.click 事件
        const dispatchEditorEvent = (e) => {
            const { target, type } = e;
            const eventName = type === 'click' ? 'base.click' : 'base.mouseDown';

            // 忽略编辑器 container 区域外点击
            if (target !== container[0] && !$.contains(container[0], target)) {
                return;
            }

            if (!this.$events.dispatchMouseEvent) return;

            // 在 event bus 上广播事件
            this.$events.$emit(eventName, e);

            // 如果 DOM 点击事件未被 preventDefault，调用组件内默认的点击处理逻辑
            if (!e.isDefaultPrevented() && type === 'click') {
                this.handleClick(e);
            }
        };

        // jQuery 监听相关 DOM 事件，后缀为可读性与后续 off 而添加
        doc.on('mousedown.base click.base', dispatchEditorEvent);

        if (!useNativeContextmenuEvent) {
            $(this.$el).on('contextmenu', (e) => {
                e.preventDefault();

                if (utils.isEditable(e.target)) {
                    return;
                }

                // FIXME: 安卓机浏览器在文本聚焦时候单击时候会触发浏览器菜单事件
                this.$events.$emit('base.contextMenu', e);
            });
        }

        // 禁止浏览器 图片 canvas 原生拖拽
        $(this.$el).on('dragstart', function (e) {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'CANVAS') {
                return false;
            }
        });

        const throttled = throttle((e) => {
            // fire hotkey action
            if (!this.editable || !this.$events.dispatchMouseEvent) {
                return;
            }
            this.$events.$emit('base.mousemove', e);
            this.$events.$emit('base.changeCursor', e);
        }, 100);
        $(this.$el).on('mousemove.base', throttled);
        $(this.$el).on('mouseover.base', (e) => {
            this.$events.$emit('base.changeCursor', e);
        });

        $(this.$el).on('mouseleave.base', (e) => {
            this.$events.$emit('base.mouseleave', e);
        });

        // clean
        this.$on('destroy', () => {
            doc.off('.base', dispatchEditorEvent);
            doc = null;
        });
    },

    // 移动端双指缩放，单双指移动画布事件
    _initDomTouchEvent() {
        const doubleTouchEvent = () => {
            const self = this;
            let lastZoom = null;
            let lastTouchesInfo = [];
            const { mousewheelMaxZoom = 4, mousewheelMinZoom = 0.15 } = this.options || {};

            // 得到两点距离
            function getDistance(p1, p2) {
                const x = p2.pageX - p1.pageX;
                const y = p2.pageY - p1.pageY;
                return Math.sqrt(x * x + y * y);
            }

            function getTouchesInfo(touches) {
                const touchList = Object.values(touches);
                return touchList.map((touch) => ({
                    pageX: touch.pageX,
                    pageY: touch.pageY,
                }));
            }

            // 通过余弦求角度
            function getCosDeg(cos) {
                let result = Math.acos(cos) / (Math.PI / 180);
                result = Math.round(result);
                return result;
            }

            // 根据两组点判断双指手势类型
            function decideTouchEvent(current = [], last = []) {
                let touchEventType = null;
                const [cPointA, cPointB] = current;
                const [lPointA, lPointB] = last;

                const newSide = {
                    pageX: cPointB.pageX - (lPointB.pageX - lPointA.pageX),
                    pageY: cPointB.pageY - (lPointB.pageY - lPointA.pageY),
                };
                const sideA = getDistance(cPointA, lPointA);
                const sideB = getDistance(cPointB, lPointB);
                const sideC = getDistance(cPointA, newSide);
                const deg = getCosDeg(
                    (sideA * sideA + sideB * sideB - sideC * sideC) / (2 * sideA * sideB),
                );

                // 两指夹角为60度以下为拖动，否则为缩放
                if (deg <= 90 || !deg) {
                    touchEventType = 'drag';
                } else {
                    touchEventType = 'zoom';
                }
                return touchEventType;
            }

            // 缩放画布
            function touchZoomLayout(currentTouches, startTouches) {
                if (!lastZoom) {
                    lastZoom = self.zoom;
                }

                const reduce = 200;

                const distance =
                    getDistance(startTouches[0], startTouches[1]) -
                    getDistance(currentTouches[0], currentTouches[1]);
                const deltaY = distance;
                const zoomScale = deltaY / reduce;
                const zoom = self.zoom * (1 - (zoomScale / 2) * 0.8);

                self.zoomTo(Math.min(mousewheelMaxZoom, Math.max(mousewheelMinZoom, zoom)));

                self.$nextTick(() => {
                    self.updateContainerRect();
                });
            }

            function singleScrollHandle(event) {
                event.preventDefault();
                const currentTouches = event.touches; // 得到第二组两个点
                const currentTouchesInfo = getTouchesInfo(currentTouches);

                // 防止双指滑动时候突然抬起一只手指引起的抖动
                if (lastTouchesInfo.length > 1) {
                    lastTouchesInfo = currentTouchesInfo;
                    return;
                }
                self.scrollContainerRect({
                    dx: currentTouchesInfo[0].pageX - lastTouchesInfo[0].pageX,
                    dy: currentTouchesInfo[0].pageY - lastTouchesInfo[0].pageY,
                });
                lastTouchesInfo = currentTouchesInfo;
            }

            const doubleHandleThrottle = throttle((event) => {
                // 判断是否有两个点在屏幕上
                const currentTouches = event.touches; // 得到第二组两个点
                const currentTouchesInfo = getTouchesInfo(currentTouches);
                const eventType = decideTouchEvent(currentTouchesInfo, lastTouchesInfo);

                if (eventType === 'drag') {
                    self.scrollContainerRect({
                        dx: currentTouchesInfo[0].pageX - lastTouchesInfo[0].pageX,
                        dy: currentTouchesInfo[0].pageY - lastTouchesInfo[0].pageY,
                    });
                } else if (eventType === 'zoom') {
                    touchZoomLayout(currentTouchesInfo, lastTouchesInfo);
                }
                lastTouchesInfo = currentTouchesInfo;
            }, 20);
            return {
                touchStart(event) {
                    if (!self.containerTouchEnable) return;
                    lastTouchesInfo = getTouchesInfo(event.touches);
                },
                touchMove(event) {
                    if (!self.containerTouchEnable) return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.touches.length === 2) {
                        doubleHandleThrottle(event);
                    } else if (event.touches.length === 1) {
                        singleScrollHandle(event);
                    }
                },
                touchEnd() {
                    if (!self.containerTouchEnable) return;
                    lastZoom = self.zoom;
                },
            };
        };
        const touchEvents = doubleTouchEvent();
        const container = this.container;
        this.enableContainerTouch();

        container[0].addEventListener('touchstart', touchEvents.touchStart, {
            passive: false,
        });
        container[0].addEventListener('touchmove', touchEvents.touchMove, {
            passive: false,
            capture: true,
        });
        container[0].addEventListener('touchend', touchEvents.touchEnd, { passive: false });
    },

    /**
     * 设置编辑器模式{@link EditorOptions.mode|mode}
     * @memberof EditorMiscMixin
     * @param {String} mode 模式{@link editorOptions.mode|mode}
     */
    setMode(mode) {
        this.mode = mode;
    },

    /**
     * 设置编辑器配置参数
     * @memberof EditorMiscMixin
     * @param {Object} options 模式{@link editorOptions|options}
     */
    setOptions(options) {
        const defaultOpionts = cloneDeep(editorDefaults.options);

        options = assign({}, defaultOpionts, this.options, options);
        if (!Array.isArray(options.padding)) {
            options.padding = [options.padding, options.padding, options.padding, options.padding];
        }

        // 字体子集
        options.subsetSuffix = '-subset' + this._uid;
        options.fontSubsetsMap = this.$fontSubsetsMap;

        if (!options.fontList || !options.fontList.length) {
            options.fontList = editorDefaults.options.fontList;
        }
        // Map fonts
        options.fontList = options.fontList.filter((item) => item && (item.name || item.family));

        options.fontsMap = options.fontList.reduceRight((ret, item) => {
            ret[item.name] = item;

            if (item.family) {
                ret[item.family] = item;
            }

            return ret;
        }, {});

        if (!options.defaultFont) {
            options.defaultFont =
                options.fontsMap['SourceHanSansSC-Regular'] || options.fontList[0];
        }

        this.innerProps.options = options;
    },

    checkVersion(v) {
        const selfVer = version.parse(this.version);
        const targetVer = version.parse(v);

        return selfVer.major >= targetVer.major;
    },

    /**
     * 开启快捷键绑定
     * @memberof EditorMiscMixin
     */
    enableHotkey() {
        this.hotkeys._disabled = false;
        if (!this.hotkeys._inited) {
            this.hotkeys._inited = true;
            this.hotkeys.init(this.handleMap);
            this.hotkeys.setContext(this);
        }
    },

    /**
     * 禁用快捷键绑定
     * @memberof EditorMiscMixin
     */
    disableHotkey() {
        this.hotkeys._disabled = true;
    },
    enableContainerTouch() {
        this.containerTouchEnable = true;
    },
    // 禁用画布touch手势
    disableContainerTouch() {
        this.containerTouchEnable = false;
    },

    // errors
    dispatchError(data = {}) {
        const errorTypesMap = {
            data: 'ValidationError',
            load: 'LoadError',
        };

        const { type, code, message: msg } = data;
        if (!errorTypesMap[type]) {
            throw new Error(`Not support ${type} error`);
        }

        // Clean
        delete data.message;

        // 优先使用原错误对象，保持堆栈
        let err = msg instanceof Error ? msg : new Error(msg);

        // Assign ext data
        // 此处不能使用 Object.assign，
        // 某些浏览器内部错误会自带 code 属性，且只读
        // Object.assign 对于只读属性会报错，= 赋值则不会
        try {
            // err.name 可能是只读的所以会报错
            err.name = errorTypesMap[type];
        } catch (e) {
            err = new Error(err.message);
            err.name = errorTypesMap[type];
        }

        err.type = type;
        err.code = code;

        this.$emit('error', err);
    },

    // Check is need check cross layout drag and drop.
    isCrossLayoutDrag(element) {
        return (
            this.options.crossLayoutDrag &&
            this.mode === 'flow' &&
            (element.type.indexOf('$') < 0 || element.type === '$selector')
        );
    },

    /**
     * 通过元素 id 获取 vue 组件实例
     * @param {*} id 元素 id
     * @param {*} component 当前的组件
     */
    getComponentById(id, component = this) {
        const isLayout =
            component &&
            component.$options.name === 'editor-layout' &&
            component.layout &&
            (component.layout.$id === id || component.layout.uuid === id);

        if (
            (component.model &&
                (component.model.$id === id || component.model.uuid === id) &&
                component.$options.name &&
                component.$options.name.includes('-element')) ||
            isLayout
        ) {
            return component;
        }
        if (!component.$children.length) {
            return null;
        }

        for (let i = 0; i < component.$children.length; i++) {
            const result = this.getComponentById(id, component.$children[i]);
            if (result) {
                return result;
            }
        }
        return null;
    },

    checkElementOver(element) {
        const layouts = this.layouts;
        const currentLayout = this.currentLayout;
        const bbox = utils.getBBoxByElement(element);

        const result = {
            fromLayoutId: this.currentLayout.$id,
            toLayoutId: null,
        };

        const relateLayout = (result.relateLayout = (() => {
            const rest = {};
            if (bbox.top > currentLayout.height) {
                rest.bottom = true;
            } else if (bbox.top < -bbox.height) {
                rest.top = true;
            }

            if (bbox.left > currentLayout.width) {
                rest.right = true;
            } else if (bbox.left < -bbox.width) {
                rest.left = true;
            }

            return rest;
        })());

        if (
            (relateLayout.top || relateLayout.bottom) &&
            !relateLayout.left &&
            !relateLayout.right
        ) {
            layouts.some((layout) => {
                if (layout !== currentLayout) {
                    const top2top = bbox.top + currentLayout.top > layout.top;
                    const top2bottom = bbox.top + currentLayout.top < layout.top + layout.height;

                    if (top2top && top2bottom) {
                        result.toLayoutId = layout.$id;
                        return true;
                    }

                    const bottom2top = bbox.top + currentLayout.top + bbox.height > layout.top;
                    const bottom2bottom =
                        bbox.top + currentLayout.top + bbox.height < layout.top + layout.height;

                    if (bottom2top && bottom2bottom) {
                        result.toLayoutId = layout.$id;
                        return true;
                    }
                }

                return false;
            });
        }

        if (element._dragRelateive && element._dragRelateive.toLayoutId !== result.toLayoutId) {
            layouts.forEach((layout) => {
                if (layout.$id === result.toLayoutId) {
                    layout.$dragOver = true;
                } else {
                    layout.$dragOver = false;
                }
            });
        }
        element._dragRelateive = result;
    },

    // 还原临时组
    _restoreTempGroup(layout) {
        let layoutElements = layout.elements.slice();

        const tempGroup = this.$refs.tempGroup;
        const currentTempGroupId = tempGroup && this.$refs.tempGroup.currentTempGroupId;
        if (currentTempGroupId && layout.elements && !layout.type) {
            let index = -1;
            const tempGroupElements = [];
            layoutElements = layout.elements.filter((element, i) => {
                if (element.$tempGroupId === currentTempGroupId) {
                    index = index === -1 ? i : index;
                    tempGroupElements.push(element);
                    return false;
                }

                return element;
            });

            if (tempGroupElements.length) {
                const group = tempGroup.cachesToGroup(currentTempGroupId);
                layoutElements.splice(index === -1 ? layoutElements.length - 1 : index, 0, group);
            }
        }
        return layoutElements;
    },
    /**
     * 获取视频、动态贴纸最大持续时间单位 ms
     * @param {Array<layout>} layouts
     * @return {Number} 持续事件
     */
    getMaxDuration(layouts = this.layouts) {
        layouts = [].concat(layouts);
        let max = 0;

        layouts.forEach((layout) => {
            if (!layout || layout.hasFilters) return;
            if (layout.isGif || layout.isApng) {
                max = Math.max(max, get(layout, 'background.image.naturalDuration'));
            }
        });

        this.walkTemplet(
            (element) => {
                if (element.type === 'video') {
                    max = Math.max(max, element.endTime - element.startTime);
                } else if (element.isGif || element.isApng) {
                    max = Math.max(max, element.naturalDuration);
                }
            },
            true,
            layouts,
        );

        // 动画专用
        let animationMax = 0;
        layouts.forEach((layout) => {
            layout?.elements.forEach((element) => {
                getAnimations(element).forEach((animation) => {
                    animationMax = Math.max(animationMax, animation.delay + animation.duration);
                });
            });
        });

        max = Math.max(max, animationMax) || 0;

        return max.toFixed(1) - 0;
    },

    /**
     * 修改 global 属性
     * @method changeGlobal
     * @param {object} props - 设置的属性对象
     */
    changeGlobal(props) {
        const layout = assign({}, this.global.layout, props.layout);
        props.layout = layout;

        this.global = assign({}, this.global, props);

        const action = { tag: 'change_global', props };
        this.makeSnapshot(action);
    },
    /**
     * 字体子集化加载
     * @param {Array|Object} layouts - 画布集合
     */
    loadFontSubset(layouts) {
        // 初始化字体子集
        this.$fontSubsetsMap = {};
        this.options.fontSubsetsMap = this.$fontSubsetsMap;
        this.options.fontSubset.initialEnable &&
            loadFontsSubset(layouts || this.layouts, this.options);
    },
};
