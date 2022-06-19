import template from './styled-text.html';
import { serialize } from '../../utils/utils';

export default {
    template: template,
    props: ['element', 'editor'],
    computed: {
        title() {
            const div = document.createElement('div');
            div.innerHTML = serialize.fromHTML(this.element.contents);
            return div.innerText;
        },
    },
};
