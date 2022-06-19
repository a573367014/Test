<template>
    <div :class="bem()" @click="handleClick">
        <div :class="innerClass" :style="[backgroundStyle(), styleRender(color)]" />
    </div>
</template>
<script>
import { gradient2BackgroundStyle, isPureColor, isGradientColor, isMapColor } from '../../utils/color';
export default {
    name: 'eui-v2-color-cube',
    props: {
        color: {
            type: [String, Object],
            default: ''
        },
        styleRender: {
            type: Function,
            default: () => {}
        },
        innerClass: {
            type: String,
            default: ''
        }
    },
    methods: {
        backgroundStyle() {
            const { color } = this;
            if(isPureColor(color)) {
                return { backgroundColor: color };
            }
            else if(isGradientColor(color)) {
                return { backgroundImage: gradient2BackgroundStyle(color) };
            }
            else if(isMapColor(color)) {
                const { image, repeat } = color;
                const backgroundRepeat = repeat === 0 ? 'no-repeat' : repeat === 1 ? 'repeat no-repeat' : repeat === 2 ? 'no-repeat repeat' : 'repeat';
                return {
                    backgroundImage: `url(${image})`,
                    backgroundRepeat: backgroundRepeat,
                    backgroundPosition: 'center'
                };
            }
            return {};
        },
        handleClick() {
            this.$emit('select', this.color);
        }
    }
};
</script>
<style lang="less">
@import '../../styles/mixin.less';
.eui-v2-color-cube {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    .transparent-background(8px, .4);
    > div {
        width: 100%;
        height: 100%;
        border-radius: 2px;
        box-sizing: border-box;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,.06);
        background-size: cover,
    }
}
</style>
