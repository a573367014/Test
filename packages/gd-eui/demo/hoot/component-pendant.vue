<template>
    <JuggleItem :left="245" :top="375">
        <div class="pendant" :style="style">
            <div class="pendant__setting">
                <h3 class="pendant__setting__title">组件 {{ componentName }}</h3>
                <div class="pendant__setting__width">
                    <div>宽度：</div>
                    <Input class="pendant__setting__input" v-model="width" />
                </div>
            </div>

            <div class="pendant__component" id="pendant"></div>
        </div>
    </JuggleItem>
</template>

<script>
import Vue from 'vue';
import JuggleItem from './JuggleItem.vue';
import { Input } from '@gaoding/gd-antd';
import '@gaoding/gd-antd/es/input/style';

export default {
    components: {
        JuggleItem,
        Input,
    },
    data: function () {
        return {
            componentName: '',
            width: 0,
        };
    },
    computed: {
        style() {
            if (this.width <= 0) {
                return {};
            }
            return {
                width: this.width + 'px',
            };
        },
    },
    methods: {
        refreshComponent(name, props) {
            const Component = Vue.component(name);
            this.componentName = name;
            let component = null;
            if (Component) {
                const pendantDom = document.getElementById('pendant');
                pendantDom.childNodes.forEach((node) => {
                    pendantDom.removeChild(node);
                });
                component = new Component({
                    propsData: props,
                }).$mount();
                pendantDom.appendChild(component.$el);
            }
            return component;
        },
    },
};
</script>

<style lang="less">
.pendant {
    padding-bottom: 24px;
    background: #fff;
    box-shadow: 0 0 8px 8px #ddd;
    &__setting {
        background: #fff;
        padding-bottom: 12px;
        &__title {
            padding: 12px 8px 0px 8px;
            cursor: pointer;
        }
        &__width {
            display: flex;
            align-items: center;
            padding-left: 8px;
        }
        &__input {
            width: 80px;
            height: 30px;
        }
        box-shadow: inset 0px -1px 1px #e7ebf0;
    }

    &__component {
        background: #fff;
        padding-top: 24px;
        display: flex;
        justify-content: center;
    }
}
</style>
