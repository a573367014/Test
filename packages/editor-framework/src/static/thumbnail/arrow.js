import template from './arrow.html';
import { i18n } from '../../i18n';

export default {
    template,
    props: ['element', 'editor'],
    data() {
        return {
            html: '',
        };
    },
    computed: {
        ratio() {
            return Math.min(43 / this.element.width, 43 / this.element.height);
        },
        style() {
            const element = this.element;
            return {
                width: element.width + 'px',
                height: element.height + 'px',
                top: (43 - element.height * this.ratio) / 2 + 'px',
                transform: `scale(${this.ratio * element.$minScale * element.$originalScale})`,
            };
        },
        title() {
            return i18n.$tsl('箭头');
        },
    },
    mounted() {
        const vm = this.editor.getComponentById(this.element.$id);
        const html = vm.$el.querySelector('.element-main-inner').innerHTML;
        this.html = html;
    },
};
