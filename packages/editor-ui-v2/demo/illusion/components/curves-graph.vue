<template>
    <div class="curves-graph-container" :style="containerStyle" ref="canvas">
        <canvas class="curves-graph" :class="{
            'is-active': currentIndex === 0
        }" :width="width" :height="height" ref="white"></canvas>
        <canvas class="curves-graph"  :class="{
            'is-active': currentIndex === 1
        }" :width="width" :height="height" ref="red"></canvas>
        <canvas class="curves-graph" :class="{
            'is-active': currentIndex === 2
        }" :width="width" :height="height" ref="green"></canvas>
        <canvas class="curves-graph" :class="{
            'is-active': currentIndex === 3
        }" :width="width" :height="height" ref="blue"></canvas>
    </div>
</template>

<script>
import CanvasCurve from 'canvas-curve';

export default {
    props: {
        width: {
            type: Number,
            default: 300,
        },

        height: {
            type: Number,
            default: 300,
        },

        currentIndex: {
            type: Number,
            default: 0,
        },

        radius: {
            type: Number,
            default: 14,
        },

        onChange: {
            type: Function,
            default: () => {}
        }
    },

    data() {
        return {
            drag: null,
            isPoint: false,
            canvasMap: [{
                key: 'white',
                color: '#FFFFFF'
            }, {
                key: 'blue',
                color: '#D54646'
            }, {
                key: 'red',
                color: '#90DD40'
            }, {
                key: 'green',
                color: '#4543DF'
            }],
            pointMap: {
                red: [],
                green: [],
                blue: [],
                white: [],
            }
        };
    },

    computed: {
        containerStyle() {
            return {
                width: this.width + 'px',
                height: this.height + 'px',
                cursor: this.isPoint ? 'move' : 'pointer'
            };
        }
    },

    methods: {
        getCanvas(item) {
            const { key } = item;

            return this.$refs[key];
        }
    },

    mounted() {
        const { width, height, currentIndex } = this;
        this.canvasMap.forEach((item, index) => {
            const canvas = this.getCanvas(item);
            item.instance = new CanvasCurve({
                canvas,
                width,
                height,
                textColor: 'white',
                controlPointColor: {
                    idle: item.color,
                    hovered: item.color,
                    grabbed: item.color
                },
                curveColor: {
                    idle: item.color,
                    moving: item.color,
                },
                drawControl: currentIndex === index,
            });
            item.instance.add({ x: 0, y: 0 });
            item.instance.add({ x: 1, y: 1 });

            item.instance.on('movePoint', function() {
                console.log('moving...');
            });
        });
    },

    destroy() {
    }
};
</script>

<style lang="less">
.curves-graph-container {
    position: relative;
    background-color: black;

    .curves-graph {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
        touch-action: manipulation;
        &.is-active {
            z-index: 1;
        }
    }
}
</style>
