# color-picker 颜色选择面板

:::demo
<style lang="less">
</style>

<template>
    <div>
        <eui-v2-color-picker
            :tabs="[{name: '纯色', value: 'color'}]"
            :color.sync="color"
            :check-cmyk-fn="checkCmyk"
            @change="update"
            @adjust-cmyk="adjustCmyk"
            format="prgb"
            enable-alpha/>
    </div>
</template>

<script>
export default {
    data() {
        return {
            color: null
        }
    },
    methods: {
        update({type, data}) {
            if (type === 'color') {
                this.color = data;
                console.log(data);
            }
        },
        checkCmyk({ r, g, b, a }) {
            return false;
        },
        adjustCmyk({ r, g, b, a }) {
            console.log(r, g, b, a);
        }
    }
}
</script>

:::