import template from './text.html';
import { serialize } from '../../utils/utils';

export default {
    template: template,
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
            const div = document.createElement('div');
            div.innerHTML = serialize.fromHTML(this.element.contents);
            return this.category + div.innerText;
        },
    },
};
