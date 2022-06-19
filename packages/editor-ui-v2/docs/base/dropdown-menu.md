# Dropdown Menu 下拉菜单

:::demo
```html
<style lang="less" scoped>
    .dropdown-menus-demo {
        &__item {
            margin-bottom: 12px;
        }
    }
</style>
<template>
    <div class="dropdown-menus-demo">
        <div class="dropdown-menus-demo__item">
            <eui-v2-dropdown-button>
                下拉按钮
                <template slot="dropdown">
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu>
                            <template slot="start">
                                <eui-v2-icon name="psd-file" />
                            </template>
                            菜单一
                        </eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>
                            菜单二
                            <template slot="end">
                                <eui-v2-icon name="help-circle" />
                            </template>
                        </eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu>菜单四</eui-v2-dropdown-menu>
                    </eui-v2-dropdown-menus>
                </template>
            </eui-v2-dropdown-button>
        </div>
        <div class="dropdown-menus-demo__item">
            <eui-v2-dropdown-button>
                大下拉按钮
                <template slot="dropdown">
                    <eui-v2-dropdown-menus>
                        <eui-v2-dropdown-menu size="large">
                            <template slot="start">
                                <eui-v2-icon name="psd-file" />
                            </template>
                            菜单一
                        </eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu size="large">
                            菜单二
                            <template slot="end">
                                <eui-v2-icon name="help-circle" />
                            </template>
                        </eui-v2-dropdown-menu size="large">
                        <eui-v2-dropdown-menu size="large">菜单三</eui-v2-dropdown-menu>
                        <eui-v2-dropdown-menu size="large">菜单四</eui-v2-dropdown-menu>
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