<template>
    <ul class="list tabs">
        <li
            class="list-item tabs-item"
            v-for="(key, index) in tabs"
            :key="index"
            :class="{ 'tabs-item-active': currentIndex === index }"
            @click="selectTab(index)"
        >{{ key }}</li>
    </ul>
</template>

<script>
export default {
    props: {
        currentIndex: {
            type: Number,
            default: 0
        },
        tabs: {
            type: Array,
            default: () => ['滤镜', '特效']
        }
    },

    methods: {
        selectTab(index) {
            this.$emit('change', index);
        }
    }
}
</script>

<style scoped lang="less">
.list {
    display: flex;
    justify-content: space-between;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;

    .list-item {
        flex-grow: 10;
    }
    &.tabs {
        .tabs-item {
            border: 1px #DFE3ED solid;
            border-left-width: 0;
            padding: 3.5px 10px;
            width: 100%;
            font-size: 14px;
            text-align: center;
            cursor: pointer;


            &:first-child {
                border-left-width: 1px;
                border-top-left-radius: 2px;
                border-bottom-left-radius: 2px;
            }

            &:last-child {
                border-top-right-radius: 2px;
                border-bottom-right-radius: 2px;
            }

            &.tabs-item-active {
                color: white;
                background: #2254F4;
                border-color: #2254F4;
                cursor: default;
            }
        }
    }
}
</style>
