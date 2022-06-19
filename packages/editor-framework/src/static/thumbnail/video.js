import template from './video.html';
import { i18n } from '../../i18n';

export default {
    template,
    props: ['element', 'editor'],
    computed: {
        ratio() {
            return Math.max(this.element.width / 43, this.element.height / 43);
        },
        transform: function () {
            return this.element.transform;
        },
        width() {
            return this.element.width / this.ratio;
        },
        height() {
            return this.element.height / this.ratio;
        },
        category() {
            const { category } = this.element;
            if (typeof category === 'object') {
                return category.name ? `[${category.name}] ` : '';
            }
            return category ? `[${category}] ` : '';
        },
        title() {
            return this.category + i18n.$tsl('视频');
        },
    },
};
