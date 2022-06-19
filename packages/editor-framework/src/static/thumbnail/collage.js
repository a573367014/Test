/**
 * EditorThumbnailCollage
 */

import EditorThumbnailCollageTpl from './collage.html';
import { i18n } from '../../i18n';

/**
 * @class EditorThumbnailCollage
 */
export default {
    template: EditorThumbnailCollageTpl,

    props: ['element', 'editor'],

    data() {
        return {};
    },

    computed: {
        category() {
            const { category } = this.element;
            if (typeof category === 'object') {
                return category.name ? `[${category.name}]` : '';
            }
            return category ? `[${category}]` : '';
        },

        title() {
            return this.category + i18n.$tsl('拼图');
        },
    },
};
