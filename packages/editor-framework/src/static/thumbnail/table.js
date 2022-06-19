import template from './table.html';
import { i18n } from '../../i18n';

const GRID_NAMS = {
    normal: i18n.$tsl('常规型表格'),
    checkbox: i18n.$tsl('选中型表格'),
    gradient: i18n.$tsl('渐变型表格'),
};

export default {
    template,

    props: ['element', 'editor'],

    computed: {
        style() {
            return {
                width: '40px',
                height: '40px',
                lineHeight: '40px',
                textAlign: 'center',
                fontSize: '24px',
            };
        },

        tableName() {
            const { gridCategory } = this.element;
            return GRID_NAMS[gridCategory];
        },
    },
};
