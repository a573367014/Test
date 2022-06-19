# Input 输入框

:::demo
```html
<style lang="less">
    .input-demo {
        &__item {
            width: 220px;
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="input-demo">
        <div class="input-demo__item">
            <eui-v2-input v-model="value" placeholder="输入内容"/>
        </div>
        <div class="input-demo__item">
            <eui-v2-input v-model="value" placeholder="输入内容" block/>
        </div>
        <div class="input-demo__item">
            <eui-v2-input v-model="value" placeholder="输入内容" block>
                <template v-slot:dropdown="dropdown" >
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单一</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单二</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-input>
        </div>
        <div class="input-demo__item">
            <eui-v2-input v-model="value" placeholder="输入内容" block disabled>
                <template v-slot:dropdown="dropdown" >
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单一</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单二</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-input>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                value: ''
            }
        }
    }
</script>
```
:::