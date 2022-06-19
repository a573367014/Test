import { compatibleEvent } from '../../utils/dom-event';
import UiContextmenu from './ui-contextmenu';
import { get } from 'lodash';
import template from './index.html';
import LayerList from '../layer-list';
import layer from './layer';
import { i18n } from '../../i18n';
import { isGroup } from '@gaoding/editor-utils/element';

export default {
    name: 'contextmenu',
    template,
    components: {
        UiContextmenu,
        LayerList,
    },
    mixins: [layer],

    data() {
        return {
            layers: [],
            menu: {
                isShow: false,
                x: 0,
                y: 0,
            },
            noSubSpace: false,
            config: {
                visible: true,
            },
        };
    },

    computed: {
        editor() {
            return this.$parent;
        },

        currentElement() {
            return this.editor.currentElement;
        },

        currentLayoutElements() {
            return this.editor ? this.editor.currentLayout.elements : [];
        },

        isCrop() {
            const { type = '' } = this.currentElement || {};
            return ['$croper', '$masker', '$watermarker'].indexOf(type) !== -1;
        },

        isLock() {
            const { selectedElements = [] } = this.editor || {};
            return selectedElements.length > 0
                ? selectedElements.some((elem) => elem.lock)
                : this.currentElement?.lock;
        },

        enableSaveElement() {
            const { enableSaveElementTypes } = this.editor.options;
            return (
                enableSaveElementTypes &&
                this.currentElement &&
                ((Array.isArray(enableSaveElementTypes) &&
                    enableSaveElementTypes.includes(this.currentElement.type)) ||
                    (enableSaveElementTypes instanceof Function &&
                        enableSaveElementTypes(this.currentElement)))
            );
        },

        isSelector() {
            return this.currentElement?.type === '$selector';
        },

        menuData() {
            const storageKey = get(
                this,
                'editor.options.clipboard.storageKey',
                'template_clipboard',
            );
            let isLocalClipboardEmpty = true;
            try {
                isLocalClipboardEmpty = !!window.localStorage.getItem(storageKey);
            } catch (e) {
                // TODO: localStorage 在非同源的 iframe 情况下可能会报错
            }

            const isClipboardEmpty =
                !get(this, 'editor.clipboard.length') && !isLocalClipboardEmpty;
            const hasElement = !!this.currentElement;
            const hasLayers = this.layers.length;
            const { isLock, currLayer, segments } = this;

            return [
                ...(this.isSelector
                    ? [
                          {
                              text: i18n.$tsl('成组'),
                              shortcut: '⌘ + G',
                              action: () => {
                                  this.editor.addGroupByElements();
                              },
                          },
                          '|',
                      ]
                    : []),
                ...(isGroup(this.currentElement)
                    ? [
                          {
                              text: i18n.$tsl('拆分组'),
                              shortcut: '⌘ + Shift + G',
                              action: () => {
                                  this.editor.flatGroup(this.currentElement);
                              },
                          },
                          '|',
                      ]
                    : []),
                ...(this.enableSaveElement
                    ? [
                          {
                              text: i18n.$tsl('保存到我的空间'),
                              action: () => {
                                  this.editor.$events.$emit(
                                      'element.save2Repository',
                                      this.currentElement,
                                  );
                              },
                          },
                          '|',
                      ]
                    : []),
                {
                    text: i18n.$tsl('复制'),
                    shortcut: 'ctrl + C',
                    disabled: !hasElement || isLock,
                    action: () => {
                        this.editor.copyElement();
                    },
                },
                {
                    text: i18n.$tsl('剪切'),
                    shortcut: 'ctrl + X',
                    disabled: !hasElement || isLock,
                    action: () => {
                        this.editor.cutElement();
                    },
                },
                {
                    text: i18n.$tsl('粘贴'),
                    shortcut: 'ctrl + V',
                    disabled: isClipboardEmpty,
                    action: () => {
                        this.editor.pasteElement();
                    },
                },

                ...(hasElement
                    ? [
                          '|',
                          this.currentElement.lock
                              ? {
                                    text: i18n.$tsl('解锁图层'),
                                    action: () => {
                                        this.toggleLock();
                                    },
                                }
                              : {
                                    text: i18n.$tsl('锁定图层'),
                                    action: () => {
                                        this.toggleLock();
                                    },
                                },
                          {
                              text: i18n.$tsl('图层顺序'),
                              data: [
                                  {
                                      text: i18n.$tsl('移到顶层'),
                                      shortcut: 'Command + Shift + ↑',
                                      action: this.setElementToTop,
                                      disabled: isLock || currLayer >= segments,
                                  },
                                  {
                                      text: i18n.$tsl('上移一层'),
                                      shortcut: 'Command + ↑',
                                      action: this.moveUp,
                                      disabled: isLock || currLayer >= segments,
                                  },
                                  {
                                      text: i18n.$tsl('下移一层'),
                                      shortcut: 'Command + ↓',
                                      action: this.moveDown,
                                      disabled: isLock || currLayer <= 0,
                                  },
                                  {
                                      text: i18n.$tsl('移到底层'),
                                      shortcut: 'Command + Shift + ↓',
                                      action: this.setElementToBottom,
                                      disabled: isLock || currLayer <= 0,
                                  },
                              ],
                          },
                      ]
                    : []),

                ...(hasLayers
                    ? [
                          '|',
                          {
                              text: i18n.$tsl('选择重叠的图层'),
                              slot: true,
                          },
                      ]
                    : []),

                ...(hasElement
                    ? [
                          '|',
                          {
                              text: i18n.$tsl('删除图层'),
                              shortcut: 'DEL',
                              type: 'danger',
                              disabled: isLock,
                              action: () => {
                                  this.editor.removeElement(null, null, true);
                              },
                          },
                      ]
                    : []),
            ];
        },
    },

    mounted() {
        this.editor.contextmenu = this;
    },

    methods: {
        // forwardElement() {
        //     this.editor.forwardElement();
        //     this.menu.isShow = false;
        // },

        // // 下一一层，多样式组件以遮罩元素为底
        // backwardElement() {
        //     this.editor.backwardElement();
        //     this.menu.isShow = false;
        // },

        setElementToTop() {
            this.editor.setElementToTop();
            this.menu.isShow = false;
        },

        // 置于底层，多样式组件以遮罩元素为底
        setElementToBottom() {
            this.editor.setElementToBottom();
            this.menu.isShow = false;
        },

        highlightLayer(event, element) {
            this.$events.$emit('element.highlight', element);
        },

        selectLayer(element) {
            this.editor.focusElement(element);
            this.$events.$emit('element.highlight', false);
            this.menu.isShow = false;
        },

        setPosition(e) {
            const { editor } = this;
            const { width, height, left, top, scrollLeft, scrollTop } = editor.containerRect;
            const { offsetWidth, offsetHeight } = this.$el;

            const { pageX, pageY } = compatibleEvent(e);
            const x = pageX - left + scrollLeft;
            const y = pageY - top + scrollTop;

            let maxLeft = width - offsetWidth + scrollLeft;
            let maxTop = height - offsetHeight + scrollTop;

            const MIN_EDGE_OFFSET = 5;
            maxLeft -= MIN_EDGE_OFFSET;
            maxTop -= MIN_EDGE_OFFSET;

            return {
                x: x > maxLeft ? x - offsetWidth - 2 : x + 2,
                y: Math.min(maxTop, y),
                remain: maxLeft - x,
            };
        },

        resetCrop() {
            const { editor, isCrop, currentElement } = this;
            if (isCrop) {
                editor.$events.$emit('element.applyEdit', currentElement);
            }
        },

        lockElement() {
            const { editor, currentElement } = this;

            editor.changeElement(
                {
                    lock: true,
                },
                currentElement,
            );

            if (currentElement.type === 'text') {
                currentElement.$editing = false;
            }
        },

        unlockElement() {
            const { editor, currentElement } = this;
            editor.changeElement(
                {
                    lock: false,
                },
                currentElement,
            );
        },

        toggleLock() {
            const { editor, isLock } = this;
            this.resetCrop();
            const hasEelectedElements = editor.selectedElements && editor.selectedElements.length;
            if (hasEelectedElements > 0) {
                editor.selectedElements.forEach((elem) => {
                    if (!elem.lock) {
                        editor.$emit('element.applyEdit');
                    }
                    editor.changeElement(
                        {
                            lock: !elem.lock,
                        },
                        elem,
                    );
                });
                editor.currentElement.lock = !editor.currentElement.lock;
            } else if (isLock) {
                this.unlockElement();
            } else {
                this.lockElement();
            }
        },

        setConfig(config) {
            Object.assign(this.config, config);
        },
    },

    events: {
        'base.contextMenu': function contextMenu(event) {
            if (!this.config.visible) return;

            this.menu.isShow = false;

            this.$events.$emit('element.highlight', false);

            const point = this.editor.pointFromEvent(event);

            if (this.editor.mode === 'flow') {
                const layout = this.editor.getLayoutByPoint(point);
                this.editor.toggleLayout(layout);
            }

            if (point) {
                this.layers = this.editor.getElementsByPoint(point.x, point.y);

                // 多选菜单可成组
                if (!this.isSelector) this.editor.focusElement(this.layers[0]);
            }

            setTimeout(() => {
                const { x, y, remain } = this.setPosition(event);
                this.menu.x = x;
                this.menu.y = y;
                this.menu.isShow = true;
                this.noSubSpace = remain <= 176;
            });
        },

        'base.click': function click(event) {
            if (this.$el.contains(event.target)) {
                event.preventDefault();
            }
        },
    },
};
