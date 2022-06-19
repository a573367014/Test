import template from './svg.html';
import { i18n } from '../../i18n';

export default {
    template,
    props: ['element', 'editor'],
    data() {
        return {
            svgContent: '',
        };
    },
    computed: {
        category() {
            const { category } = this.element;
            if (typeof category === 'object') {
                return category.name ? `[${category.name}] ` : '';
            }
            return category ? `[${category}] ` : '';
        },
        title() {
            const category = this.element.category;
            if (category && category.type === 'table') {
                return this.category + i18n.$tsl('表格元素');
            }
            return this.category + i18n.$tsl('矢量图形');
        },
    },
    mounted() {
        const vm = this.editor.getComponentById(this.element.$id);
        const svg = vm.$el.querySelector('svg');
        this.svgContent = new XMLSerializer().serializeToString(svg);
    },
};
