<template>
    <div class="ge-waterfall" ref="waterfallNode" :style="style">
        <!-- waterfall-item 和其他元素 -->
        <slot></slot>
    </div>
</template>

<script lang="ts">
import eventBus from '../../../utils/event';
import { defineComponent, PropType, reactive, ref, watch } from '@vue/composition-api';

import { useCalculator } from './hooks/use-calculator';
import { useRender } from './hooks/use-render';
import { useMetas } from './hooks/use-metas';

import { RectList } from '../../../types/waterfall';

/**
 * @title 组件名
 * GeWaterfall
 */

/**
 * @title 描述
 * 瀑布布局列表
 */

/**
 * @title 使用场景
 * @dot 横向瀑布流
 * @dot 纵向瀑布流
 * @dot grow 模式
 */

export default defineComponent({
    name: 'watefall',
    props: {
        /**
         * 窗口resize时进行重绘
         */
        autoResize: {
            type: Boolean,
            default: true,
        },
        /**
         * 绘制的默认最小时间间隔
         */
        interval: {
            type: Number,
            default: 200,
            validator: (val: number) => val >= 0,
        },
        /**
         * 元素对齐方式
         * OptionalValue: 'left', 'right', 'center'
         */
        align: {
            type: String,
            default: 'left',
            validator: (val: string) => ['left', 'right', 'center'].includes(val),
        },
        /**
         * 瀑布的分割方向，垂直或者水平，
         * OptionalValue: 'v','h'
         */
        line: {
            type: String,
            default: 'v',
            validator: (val: string) => ['v', 'h'].includes(val),
        },
        /**
         * 分割线的标准间隔
         */
        lineGap: {
            type: Number,
            required: true,
            validator: (val: number) => val >= 0,
        },
        /**
         * 分割线的最小间隔
         */
        minLineGap: {
            type: Number,
            validator: (val: number) => val >= 0,
            default: undefined,
        },
        /**
         * 分割线的最大间隔
         */
        maxLineGap: {
            type: Number,
            validator: (val: number) => val >= 0,
            default: undefined,
        },
        /**
         * 元素在水平方向的最大宽度（两种分割方向都使用）
         */
        singleMaxWidth: {
            type: Number,
            validator: (val: number) => val >= 0,
            default: undefined,
        },
        /**
         * 垂直分割时，对元素的高度进行固定，而不是计算得出
         */
        fixedHeight: {
            type: Boolean,
            default: false,
        },
        /**
         * flex缩放的比例，分割方向为v时生效，会忽略几个gap配置
         * Type: number[]
         */
        flex: {
            type: Array as PropType<number[]>,
            default: undefined,
        },
        /**
         * 观察对象，用来判断是否需要绘制
         * Type: any[]
         */
        watchTarget: {
            type: [Object, Array] as PropType<any[]>,
            default: undefined,
        },
    },
    emits: [
        /**
         * 绘制完毕
         */
        'reflowed',

        /**
         * 触发绘制
         */
        'reflow',
    ],
    setup(props, { slots, emit }) {
        const waterfallNode = ref<HTMLElement | null>(null);
        const { metas } = useMetas(props, waterfallNode, slots);

        const { calculate } = useCalculator();
        const { render } = useRender(waterfallNode);

        const style = reactive({
            height: '',
            overflow: '',
        });

        eventBus.on('reflow', () => {
            // 触发绘制
            emit('reflow');
        });

        watch(metas, reflow);

        /**
         * 对瀑布流元素进行绘制
         */
        function reflow() {
            if (!waterfallNode.value) return;

            let rects: RectList = [];
            const containerWidth = waterfallNode.value!.clientWidth;

            function setRectsAndStyle() {
                const { calculatedRects, height } = calculate(containerWidth, props, metas.value);
                rects = calculatedRects;
                style.height = height;
            }
            setRectsAndStyle();

            setTimeout(() => {
                if (isScrollBarVisibilityChange(waterfallNode.value!, containerWidth)) {
                    setRectsAndStyle();
                }

                style.overflow = 'hidden';
                render(rects, metas.value);

                eventBus.emit('reflowed');
                // 绘制完毕
                emit('reflowed');
            }, 0);
        }

        function isScrollBarVisibilityChange(el: HTMLElement, lastClientWidth: number) {
            return lastClientWidth !== el.clientWidth;
        }

        return { style, waterfallNode };
    },
});
</script>
