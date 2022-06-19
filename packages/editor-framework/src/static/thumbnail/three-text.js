import template from './three-text.html';

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
            div.innerHTML = this.element.content;
            return this.category + div.innerText;
        },
    },
};
