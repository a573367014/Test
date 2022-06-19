# Icon 图标

:::demo
```html
<style lang="less">
    .icon-demo {
        display: flex;
        flex-wrap: wrap;
        padding: 1px;

        &__item {
            border:1px solid #d8d8d8;
            margin: -1px;
            height: 120px;
            font-size: 12px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            align-items: center;
            width: 90px;

            .eui-v2-icon {
                font-size: 36px;
            }
        }
    }
</style>
<template>
    <div class="icon-demo">
        <div class="icon-demo__item" v-for="icon in icons" :key="icon">
            <eui-v2-icon :name="icon"/>
            <div>{{ icon }}</div>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                icons: []
            }
        },
        mounted() {
            const svg = document.querySelector('#__EUI_SVG_ICONS__ svg');
            if (svg) {
                this.icons = [...svg.children].map(symbol => symbol.id.replace('eui-v2-icon--', ''))
            }
        }
    }
</script>
```
:::

## API

### Css Style
| 名称      | 值          |
| --------- | ----------- |
| font-size | 32px        |
| color     | @dark-color |


### Props

| 名称   | 类型   | 默认值       | 必填 | 说明            |
| ------ | ------ | ------------ | ---- | --------------- |
| name   | String | -            | 是   | icon 名称       |
| prefix | String | `eui-v2-icon__` | 否   | icon 的命名前缀 |

### 扩展 icon

editor-ui 中使用了 `icon-sprite` 将 svg 打包并显示，内置的 icon 采用了 `eui-v2-icon__${name}` 的命名，如果需要扩展 icon 内容，可以采用相同的方式打包 svg，在使用 icon 组件时传入对应的 `name` 与 `prefix`