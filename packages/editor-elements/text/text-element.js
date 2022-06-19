/**
 * TextElement
 */

import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import { getEffectShadowList } from '@gaoding/editor-utils/effect/browser/adaptor';
import { TextEffectEngine } from '@gaoding/editor-utils/effect/browser/text-effect-engine';
import { scaleEffect } from '@gaoding/editor-utils/effect/utils';
import { getUpdateFontsSubset } from '@gaoding/editor-framework/src/utils/subset';
import TextBase from './text-base';

function syncRect() {
    this.syncRect();
}

export default inherit(TextBase, {
    name: 'text-element',
    computed: {
        effectedTextEffects() {
            return getEffectShadowList(this.model);
        },
        effectStyles() {
            const styles = TextEffectEngine.draw(this.model);
            return styles.map((style) => ({ ...this.textStyle, ...style }));
        },
    },
    methods: {
        // 是否需要加载全量字体
        checkLoadFullFont() {
            const { model, options } = this;
            const fontData = getUpdateFontsSubset([{ elements: [model] }], options);

            if (fontData) {
                Object.keys(fontData).forEach((name) => {
                    const fontSubset = options.fontSubsetsMap[name];
                    if (fontSubset) {
                        fontSubset.loadType = 'all';
                    }
                });
                this.checkLoad();
            }
        },
    },
    watch: {
        'model.$editing'(v) {
            if (!v) {
                this.syncRect();
                return;
            }
            // 进入编辑加载全量字体
            let needCheckLoad;
            this.model.contents.forEach((item) => {
                const font =
                    this.options.fontsMap[item.fontFamily || this.model.fontFamily] ||
                    this.options.defaultFont;
                const fontSubset = this.options.fontSubsetsMap[font.name];

                if (fontSubset && fontSubset.loadType !== 'all') {
                    fontSubset.loadType = 'all';
                    needCheckLoad = true;
                }
            });

            if (needCheckLoad) {
                this.checkLoad();
            }
        },

        'model.fontSize'(val, oldVal) {
            const ratio = val / oldVal || 1;

            if (
                this.options.mode === 'preview' ||
                this.model.$resizeApi ||
                this.editor.$binding.config.applyingYActions
            ) {
                return;
            }

            scaleEffect(this.model, ratio);
        },

        'model.writingMode'() {
            if (this.options.mode === 'preview' || this.editor.$binding.config.applyingYActions) {
                return;
            }

            const { model } = this;
            // 当前 resize 模式旋转 90 度后可能变为新 resize
            const newResize = {
                0b010: 0b100,
                0b100: 0b010,
                0b101: 0b011,
                0b011: 0b101,
            }[model.resize];
            model.resize = newResize || model.resize;

            // 当前 autoAdaptive 模式旋转 90 度后可能变为新 autoAdaptive
            const newAutoAdaptive = {
                0b01: 0b10,
                0b10: 0b01,
            }[model.autoAdaptive];
            model.autoAdaptive = newAutoAdaptive || model.autoAdaptive;

            [model.width, model.height] = [model.height, model.width];

            this.editor.$binding.commit({
                tag: 'change_element',
                elements: [model],
                props: {
                    resize: model.resize,
                    autoAdaptive: model.autoAdaptive,
                    width: model.width,
                    height: model.height,
                },
            });

            this.$nextTick(() => {
                this.$events.$emit('element.rectUpdate', model, {
                    width: model.width - model.height,
                    height: model.height - model.width,
                });
                this.syncRect();
            });
        },

        'model.contents'() {
            const parentModel = this.$parent.model;
            const isAutoGroup = this.editor.isGroup(parentModel) && parentModel.autoGrow;

            if (!this.model.$editing && !this.model.$draging) {
                this.checkLoadFullFont();
            }

            // 文本框在拖拽期间并处于自增组中时，其 model 尺寸交由父级 group 计算
            if (!this.$textResizeMeta || !isAutoGroup) {
                this.syncRect();
            }
        },

        'model.letterSpacing': syncRect,

        'model.lineHeight': syncRect,

        'model.padding': syncRect,
        'model.textEffects': {
            handler() {
                this.syncRect();
            },
            deep: true,
        },
        'model.shadows': {
            handler() {
                this.syncRect();
            },
            deep: true,
        },
    },
    mounted() {
        this.checkLoadFullFont();
        this.syncRect();
    },
});
