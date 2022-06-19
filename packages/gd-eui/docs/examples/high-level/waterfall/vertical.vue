<template>
    <div class="ge-waterfall-demo">
        <div class="ge-waterfall__wrapper" ref="wrapper">
            <GeWaterfall
                :line="line"
                :line-gap="200"
                :min-line-gap="100"
                :max-line-gap="220"
                :single-max-width="300"
                :watchTarget="items"
                @reflowed="reflowed"
                ref="waterfall"
            >
                <!-- each component is wrapped by a waterfall slot -->
                <GeWaterfallItem
                    v-for="(item, index) in items"
                    :width="item.width"
                    :height="item.height"
                    :order="index"
                    :key="item.index"
                    move-class="item-move"
                >
                    <div class="ge-waterfall__item" :style="item.style" :index="item.index"></div>
                </GeWaterfallItem>
            </GeWaterfall>
        </div>
    </div>
</template>

<script>
import { GeWaterfall, GeWaterfallItem } from '../../../../src';
import ItemFactory from './item-factory.js';
import '../../../../es/components/high-level/waterfall/style';

export default {
    name: 'waterfall-list-v',
    components: {
        GeWaterfall,
        GeWaterfallItem,
    },
    data: function () {
        return {
            line: 'v',
            items: ItemFactory.get(30),
            isBusy: false,
        };
    },
    mounted() {
        const waterfall = this.$refs.waterfall.$el;
        waterfall.addEventListener(
            'click',
            () => {
                this.shuffle();
            },
            false,
        );

        const wrapper = this.$refs.wrapper;
        wrapper.addEventListener('scroll', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (wrapper.scrollTop + wrapper.clientHeight >= waterfall.clientHeight - 20) {
                this.addItems();
            }
        });
    },
    methods: {
        addItems: function () {
            if (!this.isBusy && this.items.length < 500) {
                this.isBusy = true;
                this.items.push.apply(this.items, ItemFactory.get(50));
            }
        },
        shuffle: function () {
            console.log('shuffle');
            this.items.sort(function () {
                return Math.random() - 0.5;
            });
        },
        reflowed: function () {
            this.isBusy = false;
        },
    },
};
</script>

<style lang="less">
.ge-waterfall-demo {
    width: 100%;
    .ge-waterfall__wrapper {
        height: 800px;
        overflow: scroll;
        .ge-waterfall__item {
            position: absolute;
            top: 5px;
            left: 5px;
            right: 5px;
            bottom: 5px;
            font-size: 1.2em;
            color: rgb(0, 158, 107);
        }
        .ge-waterfall__item:after {
            content: attr(index);
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            -webkit-transform: translate(-50%, -50%);
            -ms-transform: translate(-50%, -50%);
        }
        .wf-transition {
            transition: opacity 0.3s ease;
            -webkit-transition: opacity 0.3s ease;
        }
        .wf-enter {
            opacity: 0;
        }
        .item-move {
            transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
        }
    }
}
</style>
