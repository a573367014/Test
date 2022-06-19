<template>
    <div class="ge-slider" :class="{ 'is-vertical': vertical }" :style="sliderStyle">
        <!-- 文本 slider 分行 -->
        <div v-if="!labelSingleLine && !vertical" class="ge-slider__multi-line">
            <span class="ge-slider__head-text">{{ label }}</span>
            <span class="ge-slider__tail-text" style="text-align: right">{{ firstValue }}</span>
        </div>
        <div class="ge-slider__prefix">
            <!-- 自定义前缀 -->
            <slot name="prefix">
                <span
                    v-if="showLabel && label"
                    class="ge-slider__head-text"
                    :class="{
                        'is-vertical': vertical,
                        'ge-slider__head-text--limit-label-width': labelWidth,
                    }"
                    :style="{
                        width: labelWidth ? `${labelWidth}px` : '',
                    }"
                >
                    {{ vertical ? firstValue : label }}
                </span>
            </slot>
        </div>
        <div
            ref="slider"
            :class="['ge-slider__track', { disabled: disabled }]"
            :style="trackStyle"
            @click="handleSliderClick"
        >
            <div class="ge-slider__bar" :style="barStyle" />
            <slider-button ref="sliderBtn" v-model="firstValue" />
            <div v-if="step > 1 && !vertical" class="ge-slider__track__mark">
                <span
                    class="ge-slider__track__mark__item"
                    @click="handleSliderMarkClick(i * step)"
                    v-for="i in markNum"
                    :style="{ left: i * markStepNum + '%' }"
                    :key="i"
                ></span>
            </div>
        </div>
        <div class="ge-slider__suffix">
            <!-- 自定义后缀 -->
            <slot name="suffix">
                <span
                    v-if="showLabel"
                    class="ge-slider__tail-text"
                    :class="{ 'is-vertical': vertical }"
                >
                    {{ vertical ? label : firstValue }}
                </span>
            </slot>
        </div>
        <g-input
            ref="sliderInput"
            v-if="showInput && !vertical"
            type="number"
            class="slider_input"
            :min="min"
            @change="handleChangeValue"
            :value="firstValue"
            @blur="handleBlur"
            :defaultValue="0"
        />
        <g-dropdown v-if="showSelect && !vertical" :trigger="['click']">
            <a class="ge-slider__select" @click.prevent>
                {{ firstValue }}
                <ge-icon type="chevron_down" />
            </a>
            <g-menu slot="overlay" class="ge-slider__select-menu">
                <g-menu-item
                    v-for="select in selectOptions"
                    :key="select"
                    @click="handleSelect(select)"
                    :class="{ active: select === firstValue }"
                >
                    {{ select }}
                </g-menu-item>
            </g-menu>
        </g-dropdown>
    </div>
</template>

<script lang="ts">
import {
    defineComponent,
    toRefs,
    provide,
    reactive,
    onMounted,
    watch,
    computed,
    onUnmounted,
} from '@vue/composition-api';
import SliderButton from './button.vue';
import { INPUT_EVENT, CHANGE_EVENT } from '../../../utils/constants';
import { useSlider } from './hooks/use-slider';
import { useInput } from './hooks/use-input';
import { useSelect } from './hooks/use-select';
import { useMark } from './hooks/use-mark';
import { on, off } from '../../../utils';
import Menu from '@gaoding/gd-antd/es/menu';
import Dropdown from '@gaoding/gd-antd/es/dropdown';
import Input from '@gaoding/gd-antd/es/input';

/**
 * @title 组件名
 * GeSlider
 */

/**
 * @title 描述
 * 滑动型输入器，展示当前值和可选范围
 */

/**
 * @title 使用场景
 * @dot 数值区间选择
 * @dot 自定义区间内选择
 */
export default defineComponent({
    name: 'GeSlider',
    components: {
        SliderButton,
        GMenu: Menu,
        GDropdown: Dropdown,
        GInput: Input,
        GMenuItem: Menu.Item,
    },
    props: {
        // 绑定值
        value: {
            type: Number,
            default: 0,
            required: true,
        },
        // 最小值
        min: {
            type: Number,
            default: 0,
        },
        // 最大值
        max: {
            type: Number,
            default: 100,
        },
        // 步数
        step: {
            type: Number,
            default: 1,
        },
        // 是否为中间起始模式，当开启中间起始模式，需要配置middle值
        middleMode: {
            type: Boolean,
            default: false,
        },
        // 中间模式时候的中间值
        middle: {
            type: Number,
            default: 0,
        },
        // 垂直模式时需要指定高度
        height: {
            type: String,
            default: '200px',
        },
        // 是否垂直显示
        vertical: {
            type: Boolean,
            default: false,
        },
        // 单行标题
        labelSingleLine: {
            type: Boolean,
            default: true,
        },
        // 是否展示输入框
        showInput: {
            type: Boolean,
            default: false,
        },
        // 是否展示下拉框
        showSelect: {
            type: Boolean,
            default: false,
        },
        // 是否展示tip
        showTooltip: {
            type: Boolean,
            default: true,
        },
        // 是否禁止拖动
        disabled: {
            type: Boolean,
            default: false,
        },
        // 前置标题
        label: {
            type: String,
            default: '',
        },
        // 限制标题宽度，0为不限制
        labelWidth: {
            type: Number,
            default: 0,
        },
        // active轨道的颜色
        backgroundActiveColor: {
            type: String,
            default: '#33383E',
        },
        // 背景的颜色
        backgroundColor: {
            type: String,
            default: '#D9DCDF',
        },
    },
    emits: [
        /**
         * 输入框值变化
         * @param {number} val 值变化
         */
        'change',

        /**
         * 输入框值变化
         * @param {number} val 值变化
         */
        'input',
    ],
    setup(props, { emit }) {
        const _emit = (val: number | number[]) => {
            emit(CHANGE_EVENT, val);
            emit(INPUT_EVENT, val);
        };
        const initData = reactive({
            firstValue: 0,
            secondValue: 0,
            oldValue: 0,
            dragging: false,
            sliderSize: 1,
        });
        const { sliderSize, firstValue } = toRefs(initData);
        const { trackStyle, sliderStyle, barStyle, slider, resetSize, handleSliderClick } =
            useSlider(props, initData, _emit);
        const { handleChangeValue, handleBlur, sliderInput } = useInput(props, firstValue);
        const { handleSelect, selectOptions } = useSelect(props, firstValue);
        const { handleSliderMarkClick, markStepNum, markNum } = useMark(props, firstValue);
        provide('SliderProvider', {
            ...toRefs(props),
            sliderSize,
            resetSize,
        });
        onMounted(() => {
            on(window, 'resize', resetSize);
            resetSize();
        });
        onUnmounted(() => {
            off(window, 'resize', resetSize);
        });
        const showLabel = computed(() => {
            return (
                (props.labelSingleLine || (props.labelSingleLine && props.vertical)) &&
                !props.showInput &&
                !props.showSelect
            );
        });
        const setValues = () => {
            const val = props.value;
            // if (props.step > 1 && props.step % 2 !== 0) {
            //     throw new Error('请传入偶数步长');
            // }
            if (props.min > props.max) {
                throw new Error('最大值需要大于最小值');
            }
            if (props.middleMode) {
                if (!props.middle) {
                    throw new Error('请传入中间值');
                }
                if (props.min >= props.middle) {
                    throw new Error('中间模式最小值必须比起始值小');
                } else if (props.max <= props.middle) {
                    throw new Error('中间模式最大值必须比起始值大');
                }
                initData.firstValue = val; // props.middle;
            } else if (typeof val === 'number' && !isNaN(val)) {
                if (val < props.min) {
                    _emit(props.min);
                } else if (val > props.max) {
                    _emit(props.max);
                } else {
                    initData.firstValue = val;
                    if (props.value !== initData.oldValue) {
                        _emit(val);
                        initData.oldValue = val;
                    }
                }
            }
        };

        watch(
            () => initData.firstValue,
            (val) => {
                _emit(val);
            },
        );
        watch(
            () => props.value,
            (val) => {
                initData.firstValue = val;
            },
        );

        watch(
            () => [props.min, props.max],
            () => {
                setValues();
            },
        );

        setValues();

        return {
            trackStyle,
            sliderStyle,
            barStyle,
            sliderDisabled: false,
            slider,
            sliderInput,
            firstValue,
            showLabel,
            handleChangeValue,
            handleBlur,
            selectOptions,
            handleSelect,
            handleSliderClick,
            handleSliderMarkClick,
            _emit,
            markStepNum,
            markNum,
        };
    },
});
</script>
