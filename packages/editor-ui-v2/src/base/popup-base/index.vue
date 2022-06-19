<script>
import BodyPopup from './body-popup.vue';
import AppendPopup from './append-popup.vue';
import { directionList, alignList } from './popup-props';

export default {
    props: {
        placement: {
            type: String,
            default: 'bottom-start',
            validator: function(value) {
                const placements = value.split('-');
                return directionList.includes(placements[0]) && alignList.includes(placements[1]);
            }
        },
        boundariesPadding: {
            type: Number,
            default: 5
        },
        tag: {
            type: String,
            default: 'div'
        },
        classes: {
            type: [Object, Array, String],
            default: () => ({})
        },
        forcePlacement: {
            type: Boolean,
            default: false
        },
        allowDirections: {
            type: Array,
            default: () => directionList
        },
        asRefWidth: {
            type: Boolean,
            default: false
        },
        reference: {
            type: [Object, String],
            default: () => null
        },
        width: {
            type: Number,
            default: 0,
        },
        height: {
            type: Number,
            default: 0
        },
        appendBody: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        position: {
            type: Object,
            default: () => {}
        }
    },
    methods: {
        getPopup() {
            return this.$refs['popupBody'];
        }
    },
    render(h) {
        const { appendBody } = this;
        const component = appendBody ? BodyPopup : AppendPopup;
        const children = Object.keys(this.$slots).map(slot => h('template', { slot }, this.$slots[slot]));
        return h(component, {
            props: this.$props,
            attrs: this.$attrs,
            on: this.$listeners,
            scopedSlots: this.$scopedSlots,
            ref: 'popupBody'
        }, children);
    }
};
</script>
