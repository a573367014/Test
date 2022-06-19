<template>
    <div
        class="text-hint"
        :class="priceClass"
        v-show="showTextHint && !editor.currentElement"
        :style="hintPosition"
    >
        <h3 v-if="showTextHintTitle" class="text-hint-title">
            {{ hintTitle }}
        </h3>
        <div class="text-hint-content">
            <Icon v-if="hintContent.icon" :name="hintContent.icon" />
            {{ hintContent.content }}
        </div>
    </div>
</template>

<script>
// 暂不支持自定义文案
import { isPriceTag, getPriceInfo } from '@gaoding/editor-utils/price-tag';
import Icon from '../../base/icon';

const PRICE_TEXT_CLASS = {
    P1: 'advanced',
    P2: 'origin',
    P3: 'extend',
    P4: 'market',
};

export default {
    components: {
        Icon,
    },
    props: {
        editor: {
            type: [Object, null],
            default: null,
            require: true,
        },
        editorText: {
            type: Object,
            default: () => ({}),
        },
        type: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            showTextHint: false,
            hintPosition: null,
            currHintElement: null,
        };
    },
    computed: {
        priceClass() {
            const currHintElement = this.currHintElement || {};
            const category = currHintElement.category || '';
            if (!category || !isPriceTag(category)) {
                return [];
            }
            const { type } = getPriceInfo(category);
            return [PRICE_TEXT_CLASS[type]];
        },
        showTextHintTitle() {
            const { currHintElement } = this;
            if (currHintElement) {
                return isPriceTag(currHintElement.category);
            }
            return false;
        },
        priceInfo() {
            const { showTextHintTitle, currHintElement } = this;
            if (showTextHintTitle) {
                return getPriceInfo(currHintElement.category);
            }
            return {};
        },
        hintTitle() {
            const { showTextHintTitle, priceInfo, editorText } = this;
            if (showTextHintTitle) {
                const { type, index } = priceInfo;
                const priceTip = editorText[type] || {};
                const title = (priceTip.title || '').replace('index', index);
                return title;
            }
            return '';
        },
        hintContent() {
            const { showTextHintTitle, priceInfo, type, currHintElement, editorText } = this;
            if (showTextHintTitle) {
                const { type } = priceInfo;
                const priceTip = editorText[type] || {};
                return {
                    content: priceTip.text || '',
                };
            }

            if (currHintElement) {
                let hintContent =
                    editorText[currHintElement.type] || editorText[currHintElement.category] || '';
                if (typeof hintContent === 'function') {
                    hintContent = hintContent(currHintElement);
                }

                if (typeof hintContent === 'string') {
                    return {
                        content: hintContent,
                    };
                }

                return hintContent || {};
            }

            return {};
        },
    },
    watch: {
        'editor.currentLayout.elements'() {
            this.showTextHint = false;
        },
    },
    created() {
        this.initGuide();
    },
    beforeDestroy() {
        this.$emit('destroy');
    },
    methods: {
        initGuide() {
            const self = this;
            let hintEnable = true;
            const editor = this.editor;
            const editorEl = editor.$el;

            const hintText = self.editorText;
            const editedMask = {};
            const parent = self.$parent;

            function dblclickHandler(e) {
                // 等待 editor 将组件内事件处理完成再触发
                // 文本双击进入编辑状态的时候不显示提示信息
                setTimeout(() => {
                    showTextHint(e); //eslint-disable-line
                }, 0);

                // 编辑过的 mask 不再显示替换提示
                if (
                    editor.currentElement &&
                    (editor.currentElement.type === 'mask' ||
                        editor.currentElement.category === 'mainImg')
                ) {
                    editedMask[editor.currentElement.$id] = true;
                }
            }

            function getHintElement(e) {
                if (!e) return;
                const { pageX, pageY } = e;
                const { shellRect, containerRect, zoom } = editor;
                const offsetX = containerRect.left + shellRect.left;
                const offsetY = shellRect.top + containerRect.top;
                const x = (pageX - offsetX) / zoom;
                const y = (pageY - offsetY) / zoom;

                const el = editor.getElementByPoint(x, y);

                return el;
            }

            function showTextHint(e, el) {
                if (
                    !hintEnable ||
                    (editor.currentLayout && editor.currentLayout.$backgroundEditing)
                ) {
                    self.showTextHint = false;
                    return;
                }

                // TODO: 背景先暂时隐藏提示
                // let el = getHintElement(e) || getHintLayout(e);
                el = el || getHintElement(e);

                self.currHintElement = el;

                if (self.type === 'editlock') {
                    if (
                        !el ||
                        el.$editing ||
                        !el.lock ||
                        ((el.type === 'mask' || el.category === 'mainImg') && editedMask[el.$id])
                    ) {
                        self.showTextHint = false;

                        return;
                    }
                } else {
                    if (
                        !el ||
                        el.$editing ||
                        el.lock ||
                        ((el.type === 'mask' || el.category === 'mainImg') && editedMask[el.$id])
                    ) {
                        self.showTextHint = false;

                        return;
                    }
                }

                const hintHeight = self.$el.offsetHeight || 35;
                const distance = hintHeight + 12;

                const { shellRect, containerRect, zoom } = editor;
                const offsetX = containerRect.left + shellRect.left;
                const offsetY = shellRect.top + containerRect.top - distance;
                const left = el.left * zoom + offsetX;
                const top = el.top * zoom + offsetY;

                self.showTextHint = !!self.hintContent.content;
                self.hintPosition = {
                    left: `${left}px`,
                    top: `${top}px`,
                };
            }

            function disableTextHint() {
                hintEnable = false;
            }

            function enableTextHint() {
                hintEnable = true;
            }

            editor.$events.$on('base.mousemove', (e) => {
                self.$nextTick(() => {
                    const point = editor.pointFromEvent(e);
                    if (editor.$picker.pick(point.x, point.y) && hintEnable && editor.$refs.hover) {
                        showTextHint(e, editor.$refs.hover.model);
                    } else {
                        self.showTextHint = false;
                    }
                });
                // lazyShowTextHint(e);
            });

            editor.$events.$on('base.mouseleave', (e) => {
                clearTimeout(this._leaveTimer);
                this._leaveTimer = setTimeout(() => {
                    self.showTextHint = false;
                }, 110);
            });

            editor.$events.$on('element.transformStart', disableTextHint);
            editor.$events.$on('element.transformEnd', enableTextHint);

            editorEl.addEventListener('mousedown', disableTextHint, false);
            editorEl.addEventListener('mouseup', enableTextHint, false);

            editor.$events.$on('transform.dblClick', dblclickHandler);

            self.$on('destroy', () => {
                editorEl.removeEventListener('mousedown', disableTextHint, false);
                editorEl.removeEventListener('mouseup', enableTextHint, false);
            });
        },
    },
};
</script>

<style lang="less">
.text-hint {
    position: absolute;
    z-index: 1;
    padding: 8px 16px;
    margin-bottom: 12px;
    color: #fff;
    font-size: 14px;
    line-height: 1.4;
    background-color: #333;
    border-radius: 2px;
    pointer-events: none;

    &-title {
        padding: 0;
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 500;
    }

    &-content {
        display: flex;
        align-items: center;
    }

    .eui-v2-icon {
        font-size: 16px;
        margin-right: 7px;
    }
}
</style>
