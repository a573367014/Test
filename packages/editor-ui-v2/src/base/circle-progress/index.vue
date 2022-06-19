<template>
    <div :style="`width: ${width}px; height:${width}px`">
        <svg :width="width" :height="width" xmlns="http://www.w3.org/2000/svg">
            <rect
                v-if="centerContent === 'block'"
                :height="wd3"
                :width="wd3"
                :x="wd3"
                :y="wd3"
                rx="1"
                :fill="barColor"
            />


            <text
                :x="wd2"
                :y="wd2 + 2"
                v-if="centerContent === 'progress'"
                :style="computedTextStyle"
                class="progress-label"
            >
                {{ text || `${progress}%` }}
            </text>

            <circle
                :r="(width-radius)/2"
                :cy="wd2"
                :cx="wd2"
                :stroke-width="radius"
                :stroke="backgroundColor"
                fill="none"
            />

            <circle
                :style="`transform: rotate(-90deg); transform-origin: ${wd2}px ${wd2}px`"
                ref="$bar"
                :r="(width-radius)/2"
                :cy="wd2"
                :cx="wd2"
                :stroke="barColor"
                :stroke-width="radius"
                :stroke-linecap="strokeLinecap"
                :stroke-dasharray="(width - radius) * Math.PI"
                :stroke-dashoffset="(width - radius) * Math.PI * (100 - progress) / 100"
                fill="none"
                class="process-circle"
            />
        </svg>
    </div>
</template>

<script>
export default {
    props: {
        /**
         * 圆形进度条尺寸
         */
        width: {
            type: Number,
            default: 50
        },
        /**
         * 进度滑块宽度
         */
        radius: {
            type: Number,
            default: 5
        },
        /**
         * 当前进度
         */
        progress: {
            type: Number,
            default: 50
        },
        /**
         * 进度滑块颜色
         */
        barColor: {
            type: String,
            default: '#2354F4'
        },
        /**
         * 进度条底色
         */
        backgroundColor: {
            type: String,
            default: '#fff'
        },
        /**
         * 进度条中间位置显示(block: 矩形方块, progress: 进度)
         */
        centerContent: {
            type: String,
            default: 'block'
        },
        /**
         * 设置路径末端样式(round: 圆角)
         */
        strokeLinecap: {
            type: String,
            default: 'round'
        },
        /**
         * 当前进度要展示的文字或数字
         */
        text: {
            type: [String, Number],
            default: ''
        },
        /**
         * 当前进度的文字颜色
         */
        fontColor: {
            type: String,
            default: '#2354f4'
        },
        /**
         * 当前进度的文字大小
         */
        fontSize: {
            type: Number,
            default: 14
        },
    },
    computed: {
        wd2() {
            return this.width / 2;
        },
        wd3() {
            return this.width / 3;
        },
        computedTextStyle() {
            if(this.centerContent !== 'progress') return null;

            return `fill: ${this.fontColor}; font-size: ${this.fontSize}px`;
        }
    }
};
</script>

<style scoped>
.progress-label{
    font-weight:bold;
    dominant-baseline: central;
    text-anchor:middle;
}
</style>
