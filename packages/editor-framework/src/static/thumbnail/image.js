import template from './image.html';
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
        clip() {
            return this.element.clip || { top: 0, left: 0, right: 0, bottom: 0 };
        },
        width() {
            return this.element.width / this.ratio;
        },
        height() {
            return this.element.height / this.ratio;
        },
        outerSize() {
            const clip = this.clip;
            return {
                width: this.width + (clip.left + clip.right) / this.ratio,
                height: this.height + (clip.top + clip.bottom) / this.ratio,
            };
        },
        imageUrl() {
            const { imageUrl, url } = this.element;
            return imageUrl || url;
        },
        category() {
            const { category } = this.element;
            if (typeof category === 'object') {
                return category.name ? `[${category.name}] ` : '';
            }
            return category ? `[${category}] ` : '';
        },
        title() {
            return this.category + i18n.$tsl('图片');
        },
    },
};
