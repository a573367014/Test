# Scroll 滚动条

## 简单示例
:::demo
```html
<style lang="less">
    .scroll-demo {
        &__item {
            padding: 12px;
            width: 290px;
            border: 1px solid #d8d8d8;
            border-radius: 4px;

            .eui-v2-scroll {
                height: 300px;
            }

            .item {
                padding: 12px;
            }
        }
    }
</style>
<template>
    <div class="scroll-demo">
        <div class="scroll-demo__item">
            <eui-v2-scroll :list="list" :item-size="46">
                <template slot="before">
                    <div class="item">前置内容</div>
                </template>
                <template v-slot:default="{ item }" >
                    <div class="item">
                        {{ item }}
                    </div>
                </template>
                <template slot="after">
                    <div class="item">后置</div>
                </template>
            </eui-v2-scroll>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            const list = [];
            for(let i = 0; i < 10000; i++) {
                list.push(`项目: ${i}`);
            }
            return {
                list: list
            }
        }
    }
</script>
```
:::

### 多列排版

:::demo
```html
<style lang="less">
    .scroll-demo {
        &__item {
            padding: 12px;
            width: 290px;
            border: 1px solid #d8d8d8;
            border-radius: 4px;

            .eui-v2-scroll {
                height: 300px;
            }

            .item {
                padding: 6px;
                img {
                   width: 70px;
                   height: 70px;
                   display: block; 
                }
            }
        }
    }
</style>
<template>
    <div class="scroll-demo">
        <div class="scroll-demo__item">
            <eui-v2-scroll :list="list" :item-size="82" :align-size="82" :max-align-size="290" :buffer="70">
                <template v-slot:default="{ item }" >
                    <div class="item">
                        <img :src="item">
                    </div>
                </template>
            </eui-v2-scroll>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            const images = [
                "https://s3.amazonaws.com/uifaces/faces/twitter/santi_urso/128.jpg",
                "https://s3.amazonaws.com/uifaces/faces/twitter/fabbianz/128.jpg",
                "https://s3.amazonaws.com/uifaces/faces/twitter/s4f1/128.jpg",
                "https://s3.amazonaws.com/uifaces/faces/twitter/atanism/128.jpg",
                "https://s3.amazonaws.com/uifaces/faces/twitter/prinzadi/128.jpg",
                "https://s3.amazonaws.com/uifaces/faces/twitter/kevinoh/128.jpg"
            ];
            const list = [];
            for(let i = 0; i < 10000; i++) {
                const random = Math.floor(Math.random() * images.length) % images.length;
                list.push(images[random]);
            }
            return {
                list: list
            }
        }
    }
</script>
```
:::