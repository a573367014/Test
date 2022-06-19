<style lang="less">
    .eui-v2-append-popup {
        position: relative;

        &__container {
            position: absolute;
            z-index: 10;
        }
    }
</style>

<template>
    <div class="eui-v2-append-popup">
        <slot />
        <div class="eui-v2-append-popup__container" :class="classes" :style="popupStyle">
            <slot name="popup"/>
        </div>
    </div>
</template>

<script>
import { directionList, alignList } from './popup-props';
import { counter } from './counter';

function getFirstComponentChild(children) {
    if(children) {
        for(let i = 0; i < children.length; i++) {
            if(children[i] && (children[i].tag || children[i].text)) {
                return children[i];
            }
        }
    }
};

export default {
    props: {
        placement: {
            type: String,
            default: () => 'bottom-start',
            validator: function(value) {
                const placements = value.split('-');
                return directionList.includes(placements[0]) && alignList.includes(placements[1]);
            }
        },
        boundariesPadding: {
            type: Number,
            default: () => 5
        },
        tag: {
            type: String,
            default: () => 'div'
        },
        classes: {
            type: [Object, Array, String],
            default: () => ({})
        },
        forcePlacement: {
            type: Boolean,
            default: () => false
        },
        allowDirections: {
            type: Array,
            default: () => directionList
        },
        // allowAligns: {
        //     type: Array,
        //     default: () => alignList
        // },
        asRefWidth: {
            type: Boolean,
            default: () => false
        }
    },
    data() {
        return {
            hasPopup: false,
            popupId: counter.get()
        };
    },
    computed: {
        popupStyle() {
            const hasPopup = this.hasPopup;
            if(hasPopup) {
                return [this.getPopupWidth(), this.popupDirectionStyle, this.popupAlignStyle];
            }
            return {
                display: 'none'
            };
        },
        popupDirection() {
            const { placement } = this;
            return placement.split('-')[0];
        },
        popupDirectionStyle() {
            const { popupDirection, boundariesPadding } = this;
            switch (popupDirection) {
                case 'top':
                    return { 'bottom': `calc(100% + ${boundariesPadding}px)` };
                case 'left':
                    return { 'right': `calc(100% + ${boundariesPadding}px)` };
                case 'right':
                    return { 'left': `calc(100% + ${boundariesPadding}px)` };
                case 'bottom':
                    return { 'top': `calc(100% + ${boundariesPadding}px)` };
            }
            return { };
        },
        popupAlign() {
            const { placement } = this;
            return placement.split('-')[1];
        },
        popupAlignStyle() {
            const { popupAlign, popupDirection } = this;
            switch (popupDirection) {
                case 'top':
                case 'bottom':
                    switch (popupAlign) {
                        case 'start':
                            return { left: 0 };
                        case 'center':
                            return { left: '50%', transform: 'translateX(-50%)' };
                        case 'end':
                            return { right: 0 };
                    }
                    break;
                case 'left':
                case 'right':
                    switch (popupAlign) {
                        case 'start':
                            return { top: 0 };
                        case 'center':
                            return { top: '50%', transform: 'translateY(-50%)' };
                        case 'end':
                            return { bottom: 0 };
                    }
            }

            return {};
        }
    },
    mounted() {
        this.hasPopup = this.getPopupChildrens().length > 0;
    },
    updated() {
        this.hasPopup = this.getPopupChildrens().length > 0;
    },
    methods: {
        getPopupChildrens() {
            return this.$scopedSlots.popup ? this.$scopedSlots.popup() : this.$slots.popup || [];
        },
        getPopupWidth() {
            const { asRefWidth } = this;
            if(asRefWidth) {
                const width = (this.$el && this.$el.clientWidth) || '';
                return { width: `${width}px` };
            }
            return {};
        },
    }
};
</script>
