<template>
    <div class="slider-list">
        <div class="slider-item" v-for="(item, index) in list" :key="item.key">
            <div v-show="item.label && item.label.length" class="slider-item__title">
                {{ item.label }}
            </div>
            <div class="slider-item__slider">
                <ge-slider
                    :value="item.value"
                    :max="item.max"
                    :min="item.min"
                    :step="item.step"
                    @change="handleChange($event, index)"
                />
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import GeSlider from '../../base/slider';
import { ISliderItem } from '../../../types/slider-list';

/**
 * @title 组件名
 * GeSliderList
 */
/**
 * @title 描述
 * 滑杆组合，支持单个、多个滑杆控制场景
 */
/**
 * @title 使用场景
 * @dot 字体样式调节
 * @dot 图片样式调节
 * @dot 等涉及单个、多个属性滑杆调节场景
 */

export default defineComponent({
    name: 'GeSliderList',
    components: {
        GeSlider,
    },
    props: {
        /**
         * 滑杆数据 list
         */
        list: {
            type: Array as PropType<ISliderItem[]>,
            default: () => [],
        },
    },
    emits: [
        /**
         * slider 改变回调
         * @param {number} val 修改的值
         * @param {number} index 在list中的index
         * @param {ISliderItem[]} list ISliderItem[]
         */
        'change',
    ],
    setup(props, { emit }) {
        const handleChange = (val: number, index: number) => {
            emit('change', val, index, props.list);
        };

        return {
            handleChange,
        };
    },
});
</script>
