# Checkbox 多选

:::demo
```html
<style lang="less">
    .checkbox-demo {
        &__item {
            width: 180px;
            margin-bottom:12px;
        }
    }
</style>
<template>
    <div class="checkbox-demo">
        <div class="checkbox-demo__item">
            <eui-v2-checkbox v-model="checkbox1">多选框</eui-v2-checkbox>
        </div>
        <div class="checkbox-demo__item">
            <eui-v2-checkbox v-model="checkbox2" side="right">多选框</eui-v2-checkbox>
        </div>
        <div class="checkbox-demo__item">
            <eui-v2-checkbox v-model="checkbox3" border>多选框</eui-v2-checkbox>
        </div>
        <div class="checkbox-demo__item">
            <eui-v2-checkbox v-model="checkbox4" border block side="right">多选框</eui-v2-checkbox>
        </div>
        <div class="checkbox-demo__item">
            <eui-v2-checkbox v-model="checkbox4" border block side="right" disabled>多选框</eui-v2-checkbox>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                checkbox1: false,
                checkbox2: true,
                checkbox3: false,
                checkbox4: false
            }
        }
    };
</script>
```
:::