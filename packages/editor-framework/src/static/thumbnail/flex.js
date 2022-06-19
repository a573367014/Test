import template from './flex.html';
import { i18n } from '../../i18n';

export default {
    template,
    props: ['element', 'editor'],
    computed: {
        category() {
            const { category } = this.element;
            if (typeof category === 'object') {
                return category.name ? `[${category.name}] ` : '';
            }
            return category ? `[${category}] ` : '';
        },
        title() {
            return this.category + i18n.$tsl('组合');
        },
    },
};
