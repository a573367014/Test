import _colorMixin from 'vue-color/src/mixin/color';
import parseColor from './parse-color';

function hsvEqual(hsv1, hsv2) {
    return (
        hsv1.h === hsv2.h &&
        hsv1.s === hsv2.s &&
        hsv1.v === hsv2.v &&
        hsv1.a === hsv2.a
    );
}

_colorMixin.data = function() {
    return {
        val: null,
        hasChanged: false,
        oldHue: 0
    };
};

export default {
    mixins: [_colorMixin],
    data() {
        return {
            val: null,
            hasChanged: false,
            oldHue: 0,
            lastValue: null,
            lastSaturationColor: '',
        };
    },
    computed: {
        colors: {
            get() {
                return this.val;
            },
            set(newVal) {
                const format = this.format;
                const lastColor = this.val._color;
                const colors = !newVal || !newVal._color
                    ? parseColor(newVal, newVal.oldHue || this.oldHue)
                    : newVal;
                const currColor = colors._color;
                if(lastColor && hsvEqual(colors.hsv, this.val.hsv)) {
                    return;
                }

                if(this.val.a === 0 && colors.a === 0) {
                    // 当透明度为0时，改变颜色没有意义，强制重置为1
                    colors.a = 1;
                    currColor._a = 1;
                }

                this.val = colors;

                // Assign default format
                currColor._format = format;
                const ret = this.useRawColor
                    ? currColor
                    : currColor.toString(format).toUpperCase();
                this.hasChanged = true;
                this.lastValue = ret;

                this.$emit('input', ret);
                this.$emit('change', colors);
            }
        }
    },
    watch: {
        value: {
            immediate: true,
            handler(newVal) {
                this.val = parseColor(newVal || this.emptyColor, this.oldHue);
                if(newVal !== this.lastValue) {
                    this.hasChanged = false;
                }
                if(this.lastSaturationColor !== this.val.hex) {
                    this.lastSaturationColor = '';
                }
            }
        }
    },
    methods: {
        colorChange(data, oldHue, type = '') {
            this.oldHue = this.colors.hsl.h;
            this.colors = parseColor(data, oldHue || this.oldHue);
            if(type === 'saturation') {
                this.lastSaturationColor = this.colors.hex;
            }
        }
    }
};
