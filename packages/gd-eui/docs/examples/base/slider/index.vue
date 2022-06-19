<template>
    <div class="GeSlider-demo">
        <div class="GeSlider-demo__wrapper">
            <div class="GeSlider-demo__wrapper__item">
                <p>简单使用</p>
                <GeSlider v-model="value" @change="change" />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>对称</p>
                <GeSlider v-model="value2" :middle="50" :isMiddle="true" />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>颜色变化</p>
                <GeSlider
                    v-model="value3"
                    backgroundColor="linear-gradient(90deg, #000000 0%, #B63382 49.52%, #ED259D 105.65%)"
                    backgroundActiveColor="linear-gradient(90deg, #FFB800 0%, #41FFA4 26.57%, #0CD3FF 52.86%, #ED1FFF 81.99%, #FF2D2D 105.65%)"
                />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>带刻度</p>
                <GeSlider v-model="value5" :step="10" />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>对称刻度</p>
                <GeSlider v-model="value12" :middle="50" :middleMode="true" :step="10" />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>带输入框</p>
                <GeSlider v-model="value6" showInput />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>带下拉框</p>
                <GeSlider v-model="value7" showSelect />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>带标题</p>
                <GeSlider v-model="value8" label="音量" />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>双行标题</p>
                <GeSlider v-model="value9" :labelSingleLine="false" label="音量" />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>隐藏toolTip</p>
                <GeSlider v-model="value10" :showTooltip="false" />
            </div>
            <div class="GeSlider-demo__wrapper__item">
                <p>禁用</p>
                <GeSlider v-model="value11" :disabled="true" />
            </div>
        </div>
    </div>
</template>

<script>
import { GeSlider } from '../../../../src/';
import '../../../../es/components/base/slider/style';

export default {
    name: 'test-slider',
    components: {
        GeSlider,
    },
    data() {
        return {
            value: 0,
            value2: 50,
            value3: 0,
            value4: 0,
            value5: 0,
            value6: 0,
            value7: 0,
            value8: 0,
            value9: 0,
            value10: 0,
            value11: 0,
            value12: 50,
        };
    },
    methods: {
        change(val) {
            console.log(val);
        },
    },
};
</script>

<style lang="less">
.GeSlider-demo {
    width: 100%;
    &__wrapper {
        display: flex;
        flex-direction: column;
        &__item {
            display: flex;
            align-items: center;
            width: 300px;
            margin-top: 20px;
            p {
                white-space: nowrap;
                margin-right: 20px;
            }
        }
    }
}
</style>
