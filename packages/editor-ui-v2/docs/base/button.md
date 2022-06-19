# Button 按钮

:::demo
```html
<style lang="less">
    .button-demo {
        &__buttons {
            margin-bottom: 12px;

            &:last-child {
                margin-bottom: 0;
            }
        }
    }
</style>
<template>
    <div class="button-demo">
        <div class="button-demo__buttons">
            <eui-v2-button @click="changeSize('large')" :size="size">大按钮</eui-v2-button>
            <eui-v2-button @click="changeSize('middle')" :size="size" color="primary">中按钮</eui-v2-button>
            <eui-v2-button @click="changeSize('small')" :size="size" color="success">小按钮</eui-v2-button>
            <!-- <eui-v2-button :size="size" color="warn">按钮</eui-v2-button> -->
            <eui-v2-button @click="changeSize('mini')" :size="size" color="error">迷你按钮</eui-v2-button>
            <eui-v2-button :size="size" color="info">按钮</eui-v2-button>
            <eui-v2-button :size="size" color="gray">按钮</eui-v2-button>
        </div>
        <div class="button-demo__buttons">
            <eui-v2-button :size="size" fill="outline">边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="primary" fill="outline">边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="success" fill="outline">边框按钮</eui-v2-button>
            <!-- <eui-v2-button :size="size" color="warn" fill="outline">边框按钮</eui-v2-button> -->
            <eui-v2-button :size="size" color="error" fill="outline">边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="info" fill="outline">边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="gray" fill="outline">边框按钮</eui-v2-button>
        </div>
        <div class="button-demo__buttons">
            <eui-v2-button :size="size" fill="clear" disabled>无边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="primary" fill="clear">无边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="success" fill="clear">无边框按钮</eui-v2-button>
            <!-- <eui-v2-button :size="size" color="warn" fill="clear">无边框按钮</eui-v2-button> -->
            <eui-v2-button :size="size" color="error" fill="clear">无边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="info" fill="clear">无边框按钮</eui-v2-button>
            <eui-v2-button :size="size" color="gray" fill="clear">边框按钮</eui-v2-button>
        </div>
        <div class="button-demo__buttons">
            <eui-v2-button :size="size" disabled>禁止按钮</eui-v2-button>
            <eui-v2-button :size="size" color="primary" disabled>禁止按钮</eui-v2-button>
            <eui-v2-button :size="size" color="success" disabled>禁止按钮</eui-v2-button>
            <!-- <eui-v2-button :size="size" color="warn" disabled>禁止按钮</eui-v2-button> -->
            <eui-v2-button :size="size" color="error" disabled>禁止按钮</eui-v2-button>
            <eui-v2-button :size="size" color="info" disabled>禁止按钮</eui-v2-button>
            <eui-v2-button :size="size" color="gray" disabled>边框按钮</eui-v2-button>
        </div>
        <div class="button-demo__buttons">
            <eui-v2-button :size="size" block>块按钮</eui-v2-button>
        </div>
        <div class="button-demo__buttons">
            <eui-v2-button :size="size" color="primary" block>块按钮</eui-v2-button>
        </div>
        <div class="button-demo__buttons">
            <eui-v2-button :size="size" icon-type="left">
                <eui-v2-icon name="arrow-left" />
                图标按钮
            </eui-v2-button>
            <eui-v2-button :size="size" color="primary" icon-type="only">
                <eui-v2-icon name="check-circle" />
            </eui-v2-button>
            <eui-v2-button :size="size" color="error" icon-type="right">
                图标按钮
                <eui-v2-icon name="arrow-right"/>
            </eui-v2-button>
        </div>
        <div class="button-demo__buttons">
            <eui-v2-button :size="size" color="primary" fill="outline" icon-type="block">
                <eui-v2-icon name="arrow-left" />
                图标按钮
            </eui-v2-button>
            <eui-v2-button :size="size" color="error" fill="clear" icon-type="block">
                <eui-v2-icon name="check-circle" />
                图标按钮
            </eui-v2-button>
        </div>
        <div class="button-demo__buttons">

            <eui-v2-button :size="size" tooltip="提示" tooltip-side="top">
                提示按钮
            </eui-v2-button>
            <eui-v2-button :size="size" tooltip="提示" tooltip-side="left">
                提示按钮
            </eui-v2-button>
            <eui-v2-button :size="size" tooltip="提示" tooltip-side="bottom">
                提示按钮
            </eui-v2-button>
            <eui-v2-button :size="size" tooltip="提示" tooltip-side="right">
                提示按钮
            </eui-v2-button>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                size: 'middle'
            };
        },
        methods:{
            changeSize(size) {
                this.size = size;
            }
        }
    };
</script>
```
:::