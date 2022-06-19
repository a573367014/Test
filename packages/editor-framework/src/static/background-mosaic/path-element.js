import inherit from '../../utils/vue-inherit';
import BaseElement from '../../base/base-element';
import template from './path-element.html';

export default inherit(BaseElement, {
    name: 'background-mosaic-path-element',
    template,
    data() {
        return {};
    },
    computed: {
        cssStyle() {
            const { rect } = this;
            const transformStr = this.transform.toString();

            return {
                height: rect.height + 'px',
                width: rect.width + 'px',
                transform: transformStr,
                left: rect.left + 'px',
                top: rect.top + 'px',
                opacity: this.opacity,
            };
        },
    },
});
