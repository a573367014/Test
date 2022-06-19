# Tabs 标签

标签组件由 `eui-v2-tabs` 与 `eui-v2-tab` 组件组成

:::demo
```html
<style lang="less">
    .tabs-demo {
        border: 1px solid #d8d8d8;

        &__panel {
            padding: 12px;
            text-align: center;
        }
    }
</style>

<template>
    <div class="tabs-demo">
        <eui-v2-tabs v-model="tab">
            <eui-v2-tab content="标签1" name="tab1"/>
            <eui-v2-tab content="标签2" name="tab2"/>
            <eui-v2-tab content="标签3" name="tab3" tip="提示"/>
            <template slot="panel">
                <div class="tabs-demo__panel">{{ tab }}</div>
            </template>
        </eui-v2-tabs>
    </div>
</template>

<script>
export default {
    data() {
        return {
            tab: 'tab1'
        };
    },

}
</script>
```
:::

当只有一个标签的时候，底部的选中线将会被去除，且标签变为左对齐

:::demo
```html
<style lang="less">
    .tabs-demo {
        border: 1px solid #d8d8d8;
    }
</style>

<template>
    <div class="tabs-demo">
        <eui-v2-tabs v-model="tab">
            <eui-v2-tab content="标签1" name="tab1"/>
        </eui-v2-tabs>
    </div>
</template>

<script>
export default {
    data() {
        return {
            tab: 'tab1'
        };
    },

}
</script>
```
:::


## eui-v2-tabs 标签容器

eui-v2-tabs 为 eui-v2-tab 的容器，其内部只允许放入 eui-v2-tab 组件

### API

#### props

| 名称  | 类型   | 默认值 | 必填 | 说明                |
| ----- | ------ | ------ | ---- | ------------------- |
| value | String | null   | -    | 当前选中的 tab 名称 |

#### events

| 名称   | 回调参数                          | 说明             |
| ------ | --------------------------------- | ---------------- |
| change | (name: string, event: MouseEvent) | tab 被点击时触发 |

## eui-v2-tab 标签

### API

#### slots

| 名称    | 说明                                                               |
| ------- | ------------------------------------------------------------------ |
| default | 覆盖 tab 中的 `content` |
| tip | 覆盖 tab 中的 `tip` |

#### props

| 名称  | 类型   | 默认值 | 必填 | 说明                |
| ----- | ------ | ------ | ---- | ------------------- |
| name | String | - | 是 | tab 的名称，用于判断当前选中的 tab |
| content | String | - | - | tab 显示的内容 |
| tip | String | - | - | 显示在 tab 右上角的提示 |
