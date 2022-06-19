import mixin from './toolbar-mixin';
import template from './toolbar-masker.html';
import PercentageScaler from './percentage-scaler';
import { i18n } from '../../i18n';

export default {
    name: 'toolbar-masker',
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
        isBackgroundCroper() {
            return this.model.type === '$background-croper';
        },

        canFitImage() {
            const {
                $imageLeft,
                $imageTop,
                width,
                height,
                $imageWidth,
                $imageHeight,
                imageTransform,
            } = this.model;

            return !(
                Math.round($imageLeft) === 0 &&
                Math.round($imageTop) === 0 &&
                Math.round(width) === Math.round($imageWidth) &&
                Math.round(height) === Math.round($imageHeight) &&
                imageTransform.rotation === 0
            );
        },
        cursorResetStyle() {
            return !this.canReset ? 'notAllowed' : 'pointer';
        },
        cursorFitStyle() {
            return !this.canFitImage ? 'notAllowed' : 'pointer';
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        editFitImage() {
            this.$events.$emit('element.editFitImage', this.model);
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
};
