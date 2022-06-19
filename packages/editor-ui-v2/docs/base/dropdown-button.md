# Dropdown Button 下拉按钮

:::demo
```html
<style lang="less">
    .dropdown-button-demo {
        &__item {
            width: 220px;
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="dropdown-button-demo">
        <div class="dropdown-button-demo__item">
            <eui-v2-dropdown-button>
                下拉按钮
                <template v-slot:dropdown="dropdown">
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单一</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单二</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu @click="dropdown.close()">下拉菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-dropdown-button>
        </div>
        <div class="dropdown-button-demo__item">
            <eui-v2-dropdown-button block>
                下拉按钮
                <template slot="dropdown">
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu>下拉菜单一</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单二</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-dropdown-button>
        </div>
        <div class="dropdown-button-demo__item">
            <eui-v2-dropdown-button block loading>
                下拉按钮
                <template slot="dropdown">
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu>下拉菜单一</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单二</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-dropdown-button>
        </div>
        <div class="dropdown-button-demo__item">
            <eui-v2-dropdown-button block>
                <div slot="prefix">说明</div>
                下拉按钮
                <template slot="dropdown">
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu>下拉菜单一</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单二</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-dropdown-button>
        </div>
        <div class="dropdown-button-demo__item">
            <eui-v2-dropdown-button block icon-type="left">
                <div slot="prefix">说明</div>
                <eui-v2-icon name="aside-chart" />
                下拉按钮
                <template slot="dropdown">
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu>下拉菜单一</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单二</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>下拉菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-dropdown-button>
        </div>
    </div>
</template>
<script>
    export default { }
</script>
```
:::