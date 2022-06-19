<style lang="less">
    @import '../../styles/variables';
    .eui-v2-text {
        font-size: 14px;
        line-height: 18px;
        color: @normal-color;

        &.eui-v2-text-primary {
            color: @primary-color;
        }

        &.eui-v2-text-gray {
            color: @gray-color;
        }
    }
</style>


<template>
    <span class="eui-v2-text" :class="textColor"><slot /></span>
</template>

<script>
export default {
    props: {
        color: {
            type: String,
            default: () => {
                return '';
            }
        }
    },
    computed: {
        textColor() {
            const { color } = this;
            if(color) {
                return `eui-v2-text-${color}`;
            }
            return '';
        }
    }
};

</script>
