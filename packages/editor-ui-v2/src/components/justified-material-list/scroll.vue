<template>
    <div>
        <template v-if="lazyScroll">
            <Scroll
                class="eui-v2-justified-material-scroll"
                :list="list"
                :item-size="getItemSize"
                :buffer="buffer">
                <template slot="before">
                    <slot name="before"/>
                </template>
                <template v-slot:default="{ item, index }">
                    <slot :row="item" :index="index"/>
                </template>
                <template slot="after">
                    <slot name="after"/>
                </template>
            </Scroll>
        </template>
        <template v-else>
            <slot name="before"/>
            <ul class="eui-v2-justified-material-list" :style="{ height: height + 'px'}">
                <transition-group
                    class="eui-v2-justified-material-list__row"
                    tag="li"
                    name="squeeze"
                    v-for="(row, rowNum) in list"
                    :key="rowNum"
                    :style="{
                        top: row[0].top + 'px',
                        height: row[0].height + 'px',
                    }"
                    @before-leave="$emit('before-leave', $event)">
                    <slot :row="row" :index="rowNum"/>
                </transition-group>
            </ul>
            <slot name="after"/>
        </template>
    </div>
</template>

<script>
import Scroll from '../../base/scroll';
export default {
    components: {
        Scroll
    },
    props: {
        lazyScroll: {
            type: Boolean,
            required: true
        },
        list: {
            type: Array,
            required: true
        },
        height: {
            type: Number,
            default: 0
        },
        boxSpacing: {
            type: Number,
            default: 8
        },
        buffer: {
            type: Number,
            default: 200
        }
    },
    methods: {
        getItemSize(item, index) {
            return item[0].height + this.boxSpacing;
        }
    }
};
</script>
