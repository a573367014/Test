<template>
    <div class="style-background">
        <Popover
            v-model="colorPickerShow"
            trigger="click"
            placement="bottomLeft"
            overlayClassName="style-background__popover"
        >
            <GeStylePreview :preview="preview" :title="title" />
            <template slot="content">
                <GeColorPicker
                    :defaultColor="colorValue"
                    :defaultGradientColor="gradientValue"
                    :defaultDegree="degree"
                    :defaultShowTab="colorTypeValue"
                    :defaultTabs="[0, 1]"
                    @colorChange="handleColorChange"
                    @gradientChange="handleGradientChange"
                    @degreeChange="handleDegreeChange"
                />
            </template>
        </Popover>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, toRef } from '@vue/composition-api';
import Popover from '@gaoding/gd-antd/es/popover';
import GeStylePreview from '../style-preview';
import GeColorPicker from '../color-picker';
import { IGradientColor, InputColor } from '../../../types';
import { usePreview } from './hooks/use-preview';
import { getIColorByString } from '../../../utils/get-icolor-by-string';

/**
 * @title 组件名
 * GeStyleBackground
 */
/**
 * @title 描述
 * 提供背景预览与背景配置
 */
/**
 * @title 使用场景
 * @dot 需要配置画布背景
 */
export default defineComponent({
    name: 'GeStyleBackground',
    components: {
        GeStylePreview,
        GeColorPicker,
        Popover,
    },
    props: {
        /**
         * 背景值
         * css string、IColor 对象 代表单色
         * IGradientColor[] 代表渐变色
         * null 代表无任何样式
         */
        value: {
            type: [String, Object, Array] as PropType<InputColor>,
            default: () => {},
        },
        /**
         * 角度，渐变色的时候使用
         */
        degree: {
            type: Number,
            default: 0,
        },
        /**
         * 描述文案
         */
        title: {
            type: String,
            default: '',
        },
    },
    emits: [
        /**
         * 样式值改变的时候回调
         * @param {IColor | string | IGradientColor[] | null} value 样式值
         * @param {number} degree 角度，渐变色样式使用
         */
        'change',
    ],
    setup(props, { emit }) {
        const { colorValue, gradientValue, colorTypeValue, preview } = usePreview(
            toRef(props, 'value'),
            toRef(props, 'degree'),
        );

        const colorPickerShow = ref(false);
        const handleColorChange = (color: string) => {
            colorValue.value = getIColorByString(color);
            emit('change', color, props.degree);
        };
        const handleGradientChange = (colors: IGradientColor[]) => {
            gradientValue.value = colors;
            emit('change', colors, props.degree);
        };
        const handleDegreeChange = (degree: number) => {
            emit('change', props.value, degree);
        };
        return {
            colorValue,
            gradientValue,
            colorPickerShow,
            colorTypeValue,
            preview,
            handleColorChange,
            handleGradientChange,
            handleDegreeChange,
        };
    },
});
</script>
