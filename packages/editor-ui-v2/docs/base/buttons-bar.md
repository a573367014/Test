# Buttons Bar 按钮组

:::demo
```html
<style lang="less">
    .buttons-bar-demo {
        &__item {
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="buttons-bar-demo">
        <div class="buttons-bar-demo__item">
            <eui-v2-buttons-bar>
                <eui-v2-button>按钮1</eui-v2-button>
                <eui-v2-button>按钮2</eui-v2-button>
                <eui-v2-button>按钮3</eui-v2-button>
                <eui-v2-button>按钮4</eui-v2-button>
            </eui-v2-buttons-bar>
        </div>
        <div class="buttons-bar-demo__item">
            <eui-v2-buttons-bar>
                <eui-v2-button color="primary">按钮1</eui-v2-button>
                <eui-v2-button color="primary">按钮2</eui-v2-button>
                <eui-v2-button color="primary">按钮3</eui-v2-button>
                <eui-v2-button color="primary">按钮4</eui-v2-button>
            </eui-v2-buttons-bar>
        </div>
        <div class="buttons-bar-demo__item">
            <eui-v2-buttons-bar fill="outline">
                <eui-v2-button fill="clear" size="mini">按钮1</eui-v2-button>
                <eui-v2-button fill="clear" size="mini">按钮2</eui-v2-button>
                <eui-v2-button fill="clear" size="mini">按钮3</eui-v2-button>
                <eui-v2-button fill="clear" size="mini">按钮4</eui-v2-button>
            </eui-v2-buttons-bar>
            
        </div>
        <div class="buttons-bar-demo__item">
            <eui-v2-buttons-bar fill="outline" style="width: 220px" justify="space-around">
                <eui-v2-button fill="clear" icon-type="only">
                    <eui-v2-icon name="text-align-center"/>
                </eui-v2-button>
                <eui-v2-button fill="clear" icon-type="only">
                    <eui-v2-icon name="text-align-left"/>
                </eui-v2-button>
                <eui-v2-button fill="clear" icon-type="only">
                    <eui-v2-icon name="text-align-right"/>
                </eui-v2-button>
                <eui-v2-button fill="clear" icon-type="only">
                    <eui-v2-icon name="koutu"/>
                </eui-v2-button>
            </eui-v2-buttons-bar>
        </div>
        <div class="buttons-bar-demo__item">
            <eui-v2-buttons-bar fill="dropdown" style="width: 220px">
                <eui-v2-button block>
                    下拉按钮
                </eui-v2-button>
                <eui-v2-dropdown-button :as-ref-width="false" placement="bottom-end">
                    <template slot="dropdown">
                        <eui-v2-dropdown-menus>
                            <eui-v2-dropdown-menu>
                                菜单 1
                            </eui-v2-dropdown-menu>
                            <eui-v2-dropdown-menu>
                                菜单 2
                            </eui-v2-dropdown-menu>
                            <eui-v2-dropdown-menu>
                                菜单 3
                            </eui-v2-dropdown-menu>
                        </eui-v2-dropdown-menus>
                    </template>
                </eui-v2-dropdown-button>
            </eui-v2-buttons-bar>
        </div>
    </div>
</template>

<script>
    export default { };
</script>
```
:::