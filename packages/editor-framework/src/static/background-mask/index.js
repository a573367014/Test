import template from './template.html';
import tinycolor from 'tinycolor2';
import renderBackgroundMask from '../../utils/renderer/background-mask';

export default {
    props: ['editor', 'global', 'options', 'layout', 'elements'],
    name: 'background-mask',
    template,
    data() {
        return {};
    },
    computed: {
        parents() {
            return this.elements.reduce((r, element) => {
                const parents = this.editor.getParentGroups(element);
                return r.concat(parents);
            }, []);
        },
        backgroundOpacity() {
            return this.layout.backgroundMask.opacity;
        },
        backgroundColor() {
            return tinycolor(this.layout.backgroundMask.color).toString('rgb');
        },
        cssStyle() {
            const { layout, global } = this;
            const { width, height } = layout;
            const style = {
                width: width * global.zoom + 'px',
                height: height * global.zoom + 'px',
            };

            return style;
        },
    },
    methods: {
        setContext() {
            const canvas = this.$refs.canvas;
            canvas.width = this.layout.width;
            canvas.height = this.layout.height;
            this.canvas = canvas;
        },
        render() {
            renderBackgroundMask({
                editor: this.editor,
                layout: this.layout,
                canvas: this.canvas,
                filterElements: this.elements,
            });
        },
    },
    mounted() {
        this.setContext();
        this.render();

        this.$watch(
            () => {
                return [this.layout.width, this.layout.height];
            },
            () => {
                this.setContext();
                this.render();
            },
        );

        this.$watch(
            () => {
                const elements = this.parents;
                return elements.map((item) => {
                    return [item.left, item.top, item.rotation, item.scaleX, item.scaleY];
                });
            },
            () => {
                this.render();
            },
        );

        this.$watch(
            () => {
                const elements = this.elements;
                return elements
                    .map((item) => {
                        return [
                            item.left,
                            item.top,
                            item.width,
                            item.height,
                            item.strokeWidth,
                            item.rotation,
                            item.radius,
                        ];
                    })
                    .concat([this.backgroundOpacity, this.backgroundColor]);
            },
            () => {
                this.render();
            },
        );
    },
};
