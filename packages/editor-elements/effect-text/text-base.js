import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import { textBase } from '../text/text-base';
import template from './effect-text-element.html';

const TextBaseElement = inherit(BaseElement, { ...textBase, events: {} });
export default inherit(TextBaseElement, {
    template,
    data() {
        return {
            ratio: 1,
        };
    },
    computed: {
        cssStyle() {
            const { rect, model } = this;

            return {
                height: rect.height + 'px',
                width: rect.width + 'px',
                transform: this.transform.toString(),
                left: rect.left + 'px',
                top: rect.top + 'px',
                opacity: this.opacity,
                overflow: model.resize === 0b111 ? 'hidden' : 'visible',
            };
        },
    },
    methods: {
        loadFont(name) {
            const superMethods = textBase.methods;
            return superMethods.load.call(this, name);
        },

        updateRect() {
            const { model } = this;
            const { zoom } = this.global;
            // rect 为隐藏文本元素宽高
            const rect = this.getRect();
            const height = rect.height / zoom;
            const width = rect.width / zoom;

            // 延迟调用 updateRect 时，dom 可能并不存在，getRect 获取的宽高可能为 0
            if (!(height > 0 && width > 0) || !this.$refs.textInner) return;

            if (Math.abs(width - model.$typoWidth) > 0.1) {
                model.$typoWidth = width;
            }
            if (Math.abs(height - model.$typoHeight) > 0.1) {
                model.$typoHeight = height;
            }

            if (model.$editing) {
                model.width = width;
                model.height = height;
            }
        },
    },
});
