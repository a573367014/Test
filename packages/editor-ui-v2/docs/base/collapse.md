# Collapse 折叠栏

:::demo
```html
<style lang="less" scoped>
    .collapse-demo {
        &__item {
            width: 220px;
            border: 1px solid #d8d8d8;
        }

        &__text {
            padding: 12px;
            text-align: center;
        }
    }
</style>
<template>
    <div class="collapse-demo">
        <div class="collapse-demo__item">
            <eui-v2-collapse :collapsed.sync="collapsed" title="折叠栏" @click-collapsed="collapsed = !$event">
                <div class="collapse-demo__text">折叠栏的内容</div>
                <div class="collapse-demo__text">折叠栏的内容</div>
            </eui-v2-collapse>
        </div>
    </div>
   
</template>
<script>
    export default {
        data() {
            return {
                collapsed: false
            }
        }
    }
</script>
```
:::

可以选择 panel 面板的样式折叠栏

:::demo
```html
<style lang="less" scoped>
    .collapse-demo {
        &__item {
            width: 220px;
            margin-bottom: 12px;
        }

        &__text {
            padding: 12px;
            text-align: center;
        }
    }
</style>
<template>
    <div class="collapse-demo">
        <div class="collapse-demo__item">
            <eui-v2-collapse :collapsed.sync="collapsed" title="折叠栏" @click-collapsed="collapsed = !$event" type="panel">
                <eui-v2-panel>
                    <eui-v2-sub-panel padding>
                        折叠栏的内容
                    </eui-v2-sub-panel>
                    <eui-v2-sub-panel padding light>
                        折叠栏的内容
                    </eui-v2-sub-panel>
                </eui-v2-panel>
            </eui-v2-collapse>
        </div>
        <div class="collapse-demo__item">
            <eui-v2-collapse :collapsed.sync="collapsed" title="折叠栏" @click-collapsed="collapsed = !$event" type="panel">
                <template slot="titlePrefix">
                    <eui-v2-button icon-type="only" fill="clear">
                        <eui-v2-icon name="view"/>
                    </eui-v2-button>
                </template>
                <eui-v2-panel>
                    <eui-v2-sub-panel padding>
                        折叠栏的内容
                    </eui-v2-sub-panel>
                    <eui-v2-sub-panel padding light>
                        折叠栏的内容
                    </eui-v2-sub-panel>
                </eui-v2-panel>
            </eui-v2-collapse>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                collapsed: true
            }
        }
    }
</script>
```
:::