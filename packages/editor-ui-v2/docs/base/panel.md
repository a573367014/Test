# Panel 面板

:::demo
```html
<style lang="less">
    .panel-demo {
        &__item {
            width: 220px;
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="panel-demo">
        <div class="panel-demo__item">
            <eui-v2-panel padding>
                面板
            </eui-v2-panel>
        </div>
        <div class="panel-demo__item">
            <eui-v2-panel>
                <eui-v2-sub-panel padding light>面板组</eui-v2-sub-panel>
                <eui-v2-sub-panel padding light>面板一</eui-v2-sub-panel>
                <eui-v2-sub-panel padding hover>面板二</eui-v2-sub-panel>
                <eui-v2-sub-panel padding hover>面板三</eui-v2-sub-panel>
                <eui-v2-sub-panel class="a">
                    <eui-v2-buttons-bar>
                        <eui-v2-button icon-type="only" fill="clear">
                            <eui-v2-icon name="lock"/>
                        </eui-v2-button>
                        <eui-v2-button icon-type="only" fill="clear">
                            <eui-v2-icon name="pen"/>
                        </eui-v2-button>
                        <eui-v2-button icon-type="only" fill="clear">
                            <eui-v2-icon name="post"/>
                        </eui-v2-button>
                    </eui-v2-buttons-bar>
                </eui-v2-sub-panel>
                <eui-v2-sub-panel>
                    <eui-v2-checkbox block padding>多选</eui-v2-checkbox>
                </eui-v2-sub-panel>
                <eui-v2-sub-panel>
                    <eui-v2-popup :visible.sync="visible">
                        <div @click="visible=true">测试</div>
                        <template slot="content">123</template>
                    </eui-v2-popup>
                </eui-v2-sub-panel>
            </eui-v2-panel>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                visible: false
            };
        }
    };
</script>
```
:::