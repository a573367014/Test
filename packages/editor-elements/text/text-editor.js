import $ from '@gaoding/editor-utils/zepto';
import { noop, isEqual } from 'lodash';

import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import RichText from '@gaoding/editor-framework/src/utils/rich-text';

import TextBase from './text-base';
import template from './text-editor.html';

const doc = $(document);
const rVoidWidth = /\u200b/gm;
const rBreakLine = /<br>|\r|\n/g;
const checkLoad = TextBase.find((obj) => obj.methods.checkLoad).methods.checkLoad;

export default inherit(TextBase, {
    name: 'text-editor',
    template,
    props: ['global', 'model', 'options', 'removeEmptyEnable'],
    data() {
        return {
            clickLocked: false,
            // 缓存contentsHTML，即时更新会导致光标选区会失效，特定时机更新
            html: '',
        };
    },
    methods: {
        // 取消自动同步
        syncRect: noop,

        initTextEditor() {
            this.createRichText();
            this.html = this.contentsHTML;
            this._initContents = RichText.fromJSON(
                this.html,
                {},
                {
                    listStyle: this.model.listStyle,
                },
            );

            this.$on('destroy', () => {
                this.model.$editing = false;
                this.$events.$emit(
                    this._isChange ? 'element.editApply' : 'element.editCancel',
                    this.model,
                );
                this.$events.$emit('richText.update', null);

                // 清理内部事件
                this._richText.clear();
            });
        },

        createRichText() {
            this._richText = new RichText(this.$refs.edit, {
                options: this.richTextOptions,
                editorOptions: this.options,
                model: this.model,
            });

            this.$events.$emit('richText.update', this._richText);

            // 捕捉字体命令，加载字体
            this._richText.cmd.on('do', (e, name, value) => {
                if (!this.model.$editing) return;
                if (name === 'fontFamily') {
                    this.load(value)
                        .then(() => {
                            return this._checkLoad();
                        })
                        .catch(console.error);
                }

                // 处理火狐textDecoration怪异表现
                // if(name === 'textDecoration') {
                //     this.setContents();
                // }
            });

            this._richText.on('changeImmediate', (e, textElem) => {
                const html = textElem.innerHTML;

                if (html !== this._prevHtml) {
                    this.setContents(this.model);
                }
                this._prevHtml = html;
            });
        },

        setContents(model) {
            if (
                !this._richText ||
                !model ||
                !['text', 'styledText', 'threeText', 'effectText'].includes(model.type) ||
                !model.$editing
            )
                return;

            let contents = this._richText.fromJSON(
                null,
                {},
                {
                    listStyle: model.listStyle,
                },
            );

            // 去除尾换行符
            Array.from(contents)
                .reverse()
                .some((item) => {
                    item.content = item.content.replace(/\n+\s*$/, '');
                    return !!item.content;
                });

            const canMerge = contents.some((item) => {
                return item.content && !!item.content.replace(rBreakLine, '');
            });

            contents = contents.filter((item) => !!item.content);

            // 属性一致将被合并至model
            // 举例：所有子元素fontSize = 12，那么合并{fontSize: 12}至model
            const mergeStyleProps = canMerge ? RichText.getAllEqualStyleProps(contents) : {};

            if (!isEqual(this._initContents, contents)) {
                this._isChange = true;
            }

            this.editor.toggleSnapshot(false);

            mergeStyleProps.contents = contents;
            mergeStyleProps.content = this.$refs.edit.textContent;

            this.editor.shallowChangeElement(mergeStyleProps, model);
            this.editor.resetAggregatedColors(model);
            this.editor.toggleSnapshot(true);

            this.$events.$emit('element.change', model, 'contents');
        },

        checkFocus() {
            const { model } = this;
            if (!model.$editing || !this._richText) return;
            this.$nextTick(() => {
                const $textElem = $(this.$refs.edit);
                const text = $textElem.text().replace(rVoidWidth, '');

                if (!text) {
                    this._richText.selection.createRangeByElem(
                        $textElem.children().last()[0] || $textElem[0],
                        true,
                    );
                    this._richText.selection.collapse();
                } else {
                    // 创建选区,光标自动选中
                    this._richText.selection.createRangeByElem($textElem[0], true);
                }
            });
        },

        onMousedown() {
            const _this = this;
            const delayFn = () => {
                setTimeout(() => {
                    _this.clickLocked = false;
                }, 160);
            };

            this.clickLocked = true;

            doc.one('mouseup.editor-text-editor', delayFn);
        },

        _checkLoad: checkLoad,
        // 忽略 EditorElement 部分特性
        checkLoad: noop,
    },
    events: {
        'base.click'(e) {
            if (this.clickLocked) {
                e.preventDefault();
            }
        },
        'base.zoom'() {
            this.html = this.contentsHTML;
            this.checkFocus();
        },
        // keydown esc
        'base.keyDown'(e) {
            const model = this.model;

            if (model && e.keyCode === 27) {
                model.$editing = false;
            }
        },
        'element.editApply'(model) {
            model = model || this.model;
            this.setContents(model);

            model.$editing = false;
        },
        'element.transformResize'() {
            this.html = this.contentsHTML;
            // 拖拽时不选中文本区、currentTextSelecttion 状态异常
            this.checkFocus();
        },
    },
    computed: {
        newGlobal() {
            return {
                ...this.global,
                zoom: 1,
            };
        },
        richTextOptions() {
            return (
                this.model && {
                    listStyle: this.model.listStyle,
                    defaultStyle: {
                        ...this.model,
                        fontSize: this.model.fontSize,
                        fontFamily: this.fontFamily,
                    },
                }
            );
        },
    },
    watch: {
        'model.fontSize'() {
            if (this.model.type === 'threeText') {
                this.html = this.contentsHTML;
            }
        },
        'model.$editing'(v) {
            if (v) this.html = this.contentsHTML;

            this.checkFocus();
        },
        model(newModel, oldModel) {
            if (oldModel) {
                // DOM还未更新，这里可以更新旧model
                this._isChange && this.$events.$emit('element.editApply', oldModel);
                oldModel.$editing = false;
            }

            this._isChange = false;

            this.html = this.contentsHTML;
        },
        richTextOptions() {
            if (this._richText && this.model) {
                this._richText.setConfig(this.richTextOptions);
            }
        },
    },

    created() {
        this.editElement = this.editor.currentSubElement || this.editor.currentElement;
    },
    mounted() {
        this.initTextEditor();
        this.checkFocus();
    },
});
