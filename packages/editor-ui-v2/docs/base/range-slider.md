# RangeSlider 滑块


## 示例

:::demo
```html
<style lang="less">
    .range-slider-demo {
        &__item {
            padding: 12px;
            width: 120px;
            border: 1px solid #d8d8d8;
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="range-slider-demo">
        <div class="range-slider-demo__item">
            <eui-v2-range-slider v-model="value" :type="type" :bubble="bubble"/>
        </div>
        <div class="range-slider-demo__item">
            <eui-v2-range-slider v-model="value" :start="50" :min="min" :max="max" :type="type" :bubble="bubble"/>
        </div>
        <div class="range-slider-demo__item">
            <eui-v2-range-slider v-model="value" :start="50" :min="min" :max="max" :type="type" :bubble="bubble" disabled/>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                value: 50,
                min: 0,
                max: 100,
                type: 'number',
                bubble: true
            }
        }
    }
</script>
```
:::

可以通过 `bonding` 与 `start` 参数设置吸附功能:

:::demo
```html
<template>
    <div class="range-slider-demo">
        <div class="range-slider-demo__item">
            <eui-v2-range-slider v-model="value" :start="50" :min="min" :max="max" :type="type" :bubble="bubble" :bonding="3"/>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                value: 50,
                min: 0,
                max: 100,
                type: 'number',
                bubble: true
            }
        }
    }
</script>
```
:::