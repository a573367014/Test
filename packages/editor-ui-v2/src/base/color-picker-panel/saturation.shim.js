import Saturation from 'vue-color/src/components/common/Saturation.vue';

const _throttle = Saturation.methods.throttle;
const _handleChange = Saturation.methods.handleChange;
const _handleMouseUp = Saturation.methods.handleMouseUp;

export default {
    mixins: [Saturation],
    data() {
        return {
            lockHsv: false,
            lastHsv: null
        };
    },
    computed: {
        pointerTop() {
            const hsv = this.lastHsv || this.colors.hsv;

            return (-(hsv.v * 100) + 1) + 100 + '%';
        },
        pointerLeft() {
            const hsv = this.lastHsv || this.colors.hsv;

            return hsv.s * 100 + '%';
        }
    },
    methods: {
        throttle(fn, data) {
            _throttle.call(this, () => {
                this.lastHsv = {
                    h: data.h,
                    s: data.s,
                    v: data.v
                };

                fn(data);
            }, data);
        },
        handleChange(...args) {
            this.lockHsv = true;

            _handleChange.call(this, ...args);
        },
        handleMouseUp(...args) {
            this.lockHsv = false;

            _handleMouseUp.call(this, ...args);
        }
    },
    watch: {
        value() {
            if(!this.lockHsv) {
                this.lastHsv = null;
            }
        }
    }
};
