import mixin from './toolbar-mixin';
import template from './toolbar-background-croper.html';
import PercentageScaler from './percentage-scaler';
import { i18n } from '../../i18n';

export default {
    name: 'toolbar-background-croper',
    props: ['$events'],
    template,
    data() {
        return {
            canReset: false,
        };
    },
    components: {
        PercentageScaler,
    },
    mixins: [mixin],
    computed: {
        cursorStyle() {
            return !this.canReset ? 'notAllowed' : 'pointer';
        },
    },
    mounted() {
        this.$watch(
            'model',
            (model) => {
                clearTimeout(this._canResetTimer);
                this._canResetTimer = setTimeout(() => {
                    if (model && model.$canReset) {
                        this.canReset = model.$canReset();
                    }
                }, 100);
            },
            {
                deep: true,
                immediate: true,
            },
        );
    },
    methods: {
        $tsl: i18n.$tsl,
    },
};
