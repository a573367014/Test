import template from './watermark.html';

export default {
    template: template,
    props: ['element'],
    computed: {
        category() {
            return '[水印]';
        },
        title() {
            const div = document.createElement('div');
            div.innerHTML = this.element.title;
            return this.category + div.innerText;
        },
    },
};
