# Degree Input 角度输入框

:::demo
```html
<style lang="less">
    .degree-input-demo {
        &__item {
            width: 220px;
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="degree-input-demo">
        <div class="degree-input-demo__item">
            <eui-v2-degree-input v-model="value"/>
        </div>
        <div class="degree-input-demo__item">
            <eui-v2-degree-input v-model="value" :step="5" block border :padding="false"/>
        </div>
        <div class="degree-input-demo__item">
            <eui-v2-degree-input label="偏移角度" v-model="value" block border :label-width="60">
            </eui-v2-degree-input>
        </div>
        <div class="degree-input-demo__item">
            <eui-v2-degree-input v-model="value" disabled block border/>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                value: 0
            }
        }
    }
</script>
```
:::