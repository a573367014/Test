<template>
    <div class="illusion-nav-bar" :style="navStyle">
        <div class="nav-bar--left"><slot name="left"></slot></div>
        <div class="nav-bar--right"><slot name="right"></slot></div>
    </div>
</template>

<script>
export default {
    props: {
        height: {
            type: Number,
            default: 54
        },
        backgroundColor: {
            type: String,
            default: '#FFFFFF'
        }
    },

    computed: {
        navStyle() {
            return {
                height: this.height + 'px',
                backgroundColor: this.backgroundColor
            };
        }
    }
}
</script>

<style lang="less">
.illusion-nav-bar {
    display: flex;
    justify-content: space-between;
    .nav-bar--left, .nav-bar--right {
        display: flex;
        justify-content: flex-start;
    }
}
</style>
