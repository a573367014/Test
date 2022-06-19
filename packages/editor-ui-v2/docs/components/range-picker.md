# range-picker 表单滑块

常用示例

:::demo
```html
<style lang="less">
    .range-picker-demo {
        &__item {
            width: 220px;
            border: 1px solid #d8d8d8;
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="range-picker-demo">
        <div class="range-picker-demo__item">
            <eui-v2-range-picker v-model="lineHeight" :min="1" :max="100" />
        </div>
        <div class="range-picker-demo__item">
            <eui-v2-range-picker label="行间距" v-model="lineHeight" :min="1" :max="100" />
        </div>
        <div class="range-picker-demo__item">
            <eui-v2-range-picker label="行间距" v-model="lineHeight" :min="1" :max="100" disabled/>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                lineHeight: 12
            }
        }
    }
</script>
```
:::

可以设置 label 与 input 的宽度

:::demo
```html
<style lang="less">
    .range-picker-demo {
        &__item {
            width: 220px;
            border: 1px solid #d8d8d8;
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="range-picker-demo">
        <div class="range-picker-demo__item">
            <eui-v2-range-picker label="行间距" v-model="lineHeight" :min="1" :max="100" :label-width="70"/>
        </div>
        <div class="range-picker-demo__item">
            <eui-v2-range-picker label="行间距" v-model="lineHeight" :min="1" :max="1000" :input-width="32"/>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                lineHeight: 12
            }
        }
    }
</script>
```
:::