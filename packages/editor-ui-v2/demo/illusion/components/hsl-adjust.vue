<template>
    <div class="hsl-container">
        <div class="hsl-color-item"
            v-for="(item, index) in hslColorMap"
            :key="index"
            :style="getStyle(item)"
            :class="{
                active: item.select,
                'is-change': item.change
            }"
            @click="select(item)"
        ></div>
        <range-slider-group class="hsl-range-slider" :list="rangeList"></range-slider-group>
    </div>
</template>

<script>
import RangeSliderGroup from './range-slider-group';

export default {
    components: {
        RangeSliderGroup
    },

    props: {
    },

    data() {
        return {
            rangeList: [
                {
                    name: '色相',
                    value: 0,
                    fromZero: true,
                    max: 30,
                    min: -30,
                },
                {
                    name: '饱和度',
                    value: 0,
                    fromZero: true,
                    max: 30,
                    min: -30,
                },
                {
                    name: '明度',
                    value: 0,
                    fromZero: true,
                    max: 30,
                    min: -30,
                }
            ],
            hslColorMap: [
                {
                    color: '#EF494A',
                    change: false,
                    select: false,
                },
                {
                    color: '#E98B31',
                    change: false,
                    select: false,
                },
                {
                    color: '#EFF12E',
                    change: false,
                    select: false,
                },
                {
                    color: '#90DD40',
                    change: false,
                    select: false,
                },
                {
                    color: '#E44BE4',
                    change: false,
                    select: false,
                },
                {
                    color: '#9E50EC',
                    change: false,
                    select: false,
                },
                {
                    color: '#4543DF',
                    change: false,
                    select: false,
                },
                {
                    color: '#34D8D7',
                    change: false,
                    select: false,
                }
            ]
        };
    },

    methods: {
        getStyle(item) {
            const { color } = item;
            return {
                background: color
            };
        },

        select(item) {
            this.hslColorMap.forEach(hslItem => {
                hslItem.select = false;
            });
            item.select = true;
        }
    }

};
</script>

<style scoped lang="less">
.hsl-container {
    display: flex;
    flex-wrap: wrap;
    padding: 18px 14px;
    .hsl-range-slider {
        flex: 1;
        padding: 20px 0px 0px;
    }
    .hsl-color-item {
        width: 52px;
        height: 28px;
        cursor: pointer;
        &.active {
            border-radius: 4px;
            box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.2);
            transition: transform .3s ease;
            transform: scale(1.2);
        }
        &:first-child {
            border-top-left-radius: 4px;
        }
        &:last-child {
            border-bottom-right-radius: 4px;
        }
        &:nth-child(4) {
            border-top-right-radius: 4px;
        }
        &:nth-child(5) {
            border-bottom-left-radius: 4px;
        }
    }
}
</style>
