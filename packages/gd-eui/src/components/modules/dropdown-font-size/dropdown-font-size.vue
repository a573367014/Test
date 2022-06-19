<template>
    <Dropdown :visible="focus" :placement="'bottomRight'">
        <div class="ge-dropdown-font-size" :class="overlayClass">
            <input
                class="ge-dropdown-font-size__input"
                :class="{
                    'ge-dropdown-font-size__input-mixed': mixed,
                }"
                ref="inputRef"
                :value="innerValue"
                :step="step"
                :min="min"
                :max="max"
                @focus="onInpFocus"
                @blur="onInpBlur"
                @input="onInput"
                @click="onInputClick"
                @keypress.enter="onEnter"
                @keydown.up.prevent="onArrowUp()"
                @keydown.down.prevent="onArrowDown()"
            />
            <div
                class="ge-dropdown-font-size__size"
                :class="{
                    'ge-dropdown-font-size__size-mixed': mixed,
                }"
                :style="{
                    display: focus ? 'none' : 'block',
                }"
            >
                {{ showFontSize }}
            </div>
            <div v-show="!mixed" class="ge-dropdown-font-size__bts">
                <span
                    class="ge-dropdown-font-size__increase"
                    role="button"
                    @click.stop="onArrowUp()"
                >
                    <ge-icon type="chevron_up_outline" />
                </span>
                <span
                    class="ge-dropdown-font-size__decrease"
                    role="button"
                    @click.stop="onArrowDown()"
                >
                    <ge-icon type="chevron_down" />
                </span>
            </div>
        </div>

        <Menu
            :style="{
                width: 104 + 'px',
                height: menuHeight + 'px',
                overflow: 'scroll',
            }"
            slot="overlay"
        >
            <MenuItem v-for="item in fontSizeList" :key="item" @mousedown="itemClick(item)">
                {{ item }}
            </MenuItem>
        </Menu>
    </Dropdown>
</template>
<script lang="ts">
import { defineComponent, toRef, ref, PropType, computed, watch } from '@vue/composition-api';
import Dropdown from '@gaoding/gd-antd/es/dropdown';
import Menu from '@gaoding/gd-antd/es/menu';
import MenuItem from '@gaoding/gd-antd/es/menu/MenuItem';
import { useShowFontSize } from './hook/use-show-font-size';
import { useInputToNumber } from '../../../hooks/use-input-to-number';

/**
 * @title 组件名
 * GeDropdownFontSize
 */
/**
 * @title 描述
 * 字号选择器
 */
/**
 * @markdown
 * ### 使用场景
 * - 字号选择
 */
export default defineComponent({
    name: 'GeDropdownFontSize',
    components: {
        Dropdown,
        Menu,
        MenuItem,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        /**
         * 字号值
         */
        value: { type: Number, default: 14 },
        /**
         * 字号列表
         */
        fontSizeList: {
            type: Array as PropType<Array<number>>,
            default: () => [
                6, 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 84, 96, 108, 120, 140, 150,
                160, 180, 200, 250, 300, 400, 500,
            ],
        },
        /**
         * 单步增减幅度
         */
        step: { type: Number, default: 1 },
        /**
         * 最大值
         */
        max: { type: Number, default: Infinity },
        /**
         * 最小值
         */
        min: { type: Number, default: 1 },
        /**
         * 是否存在多种字号
         */
        mixed: { type: Boolean, default: false },
        /**
         * 样式覆盖
         */
        overlayClass: { type: String, default: '' },
    },
    emits: [
        /**
         * 当字号改变的时候回调
         * @param {number} value
         */
        'change',
        /**
         * 聚焦的时候回调
         */
        'focus',
        /**
         * 失焦的时候回调
         */
        'blur',
    ],
    setup(props, { emit }) {
        const filterValue = (value: number) => {
            let targetValue = value;
            targetValue > props.max && (targetValue = props.max);
            targetValue < props.min && (targetValue = props.min);
            return targetValue;
        };
        const innerValue = ref(filterValue(props.value));
        const inputRef = ref();
        const focus = ref(false);
        const { showFontSize } = useShowFontSize(innerValue, toRef(props, 'mixed'));

        const menuHeight = computed(() => {
            const preHeight = props.fontSizeList.length * 45;
            if (preHeight > 280) {
                return 280;
            }
            return preHeight;
        });
        watch(
            () => props.value,
            (newVal: number) => {
                innerValue.value = filterValue(newVal);
            },
        );
        const onInputClick = () => {
            if (inputRef.value) {
                inputRef.value.select();
            }
        };
        const onInpFocus = () => {
            focus.value = true;
            emit('focus');
        };
        const onInpBlur = () => {
            focus.value = false;
            emit('blur');
        };
        const innerValueStr = computed(() => {
            return innerValue.value + '';
        });
        const changeAndEmit = (value: number) => {
            innerValue.value = filterValue(value);
            emit('change', value);
        };
        const onInput = (event: InputEvent) => {
            const target = event.target as HTMLInputElement;
            const value = target.value;
            if (!value) {
                return;
            }
            const inputValue = useInputToNumber(value, innerValue.value);
            changeAndEmit(inputValue);
            target.selectionStart = `${inputValue}`.length;
            target.value = innerValueStr.value;
        };
        const onEnter = (event: InputEvent) => {
            (event.target as HTMLInputElement).blur();
        };
        const onArrowUp = () => {
            const value = innerValue.value + props.step;
            changeAndEmit(value);
        };
        const onArrowDown = () => {
            const value = innerValue.value - props.step;
            changeAndEmit(value);
        };
        const itemClick = (value: number) => {
            changeAndEmit(value);
        };
        return {
            menuHeight,
            focus,
            innerValue,
            inputRef,
            showFontSize,
            onInputClick,
            onInpFocus,
            onInpBlur,
            onInput,
            onEnter,
            onArrowUp,
            onArrowDown,
            itemClick,
        };
    },
});
</script>
