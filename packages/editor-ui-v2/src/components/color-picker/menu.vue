<template>
    <div :class="bem('')">
        <div
            :class="[bem('item')]"
            :key="opt.value"
            v-for="opt in options"
            @click="handleItemClick(opt.value)"
            @mouseenter="handleItemMouseEnter(opt.value, $event)">
            <span :class="bem('item__label')">{{ opt.name }}</span>
            <!-- <Icon v-if="opt.children" :class="bem('item__arrow')" name="arrow-down" /> -->
        </div>
    </div>
</template>
<script>
export default {
    name: 'eui-v2-picker-color-menu',
    props: {
        options: {
            type: Array,
            default: () => []
        }
    },
    methods: {
        handleItemClick(v) {
            this.$emit('select', v);
        },
        handleItemMouseEnter(v, e) {
            this.$emit('hover', v, e);
        }
    }
};
</script>
<style lang="less">
&.eui-v2-picker-color-menu {
    z-index: 2;
    max-height: 150px;
    padding: 4px 0;
    background-color: white;
    box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.16), 0px 1px 8px rgba(0, 0, 0, 0.06), 0px 4px 12px rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    color: #33383E;
    font-size: 14px;

    &__item {
        position: relative;
        padding: 5px 12px;
        display: flex;
        align-items: center;
        cursor: pointer;

        &:hover {
            background-color: #F6F7F9;
        }

        &__label {
            margin-right: auto;
            line-height: 22px;
        }
        &__arrow {
            margin-top: 4px;
            transform: rotate(-90deg);
            font-size: 16px;
        }
    }
}
</style>
