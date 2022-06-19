<template>
    <ul class="select-panel">
        <li
            v-for="(item, idx) in list"
            @click="onSelect(item)"
            :key="idx"
        >
            <div class="select-list">{{ item.label }}</div>
        </li>
    </ul>
</template>

<script>
export default {
    props: {
        currentLabel: {
            type: String,
            default: ''
        },

        onSelect: {
            type: Function,
            default: () => {}
        },

        list: {
            type: Array,
            default: () => []
        },
    }
};
</script>

<style lang="less" scoped>
.select-panel {
    font-size: 12px;
    width: 100%;
    padding: 5px 0px;
}
.select-list {
    font-size: 12px;
    padding: 2px 10px;
    cursor: pointer;
    &:hover {
        background-color: #F0F3F4;
    }
}
</style>
