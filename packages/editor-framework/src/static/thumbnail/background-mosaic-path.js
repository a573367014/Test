import template from './background-mosaic-path.html';
import { i18n } from '../../i18n';

export default {
    template: template,
    props: ['element'],
    computed: {},
    methods: {
        $tsl: i18n.$tsl,
    },
};
