<template>
    <div class="component-desc-wrap">
        <h3>{{ title }}</h3>
        <div class="component-desc-wrap__desc">{{ desc }}</div>
        <div class="component-desc-wrap__line"></div>
        <div class="component-desc-wrap__main">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        title: {
            type: String,
            default: '',
        },
        desc: {
            type: String,
            default: '',
        },
    },
};
</script>

<style lang="less">
.component-desc-wrap {
    &__desc {
        padding: 12px 8px;
        font-size: 16px;
    }
    &__main {
        padding-top: 24px;
    }
    &__line {
        background: #eaeefb;
        width: 100%;
        height: 1px;
    }
}
</style>
