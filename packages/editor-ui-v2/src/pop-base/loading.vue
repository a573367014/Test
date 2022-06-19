<template>
    <div
        class="loding-container"
        :style="loadingPosition"
        v-if="showLoading"
    >
        <span class="loading-bounder ball1" />
        <span class="loading-bounder ball2" />
        <span class="loading-bounder ball3" />
    </div>
</template>

<script>
export default {
    props: {
        loadingPosition: {
            type: Object,
            default: () => ({})
        },
        showLoading: {
            type: Boolean,
            default: false
        }
    },
};
</script>

<style lang="less" scoped>
.loding-container {
    width: 54px;
    height: 22px;
    border-radius: 11px;
    display: flex;
    justify-content: center;
    align-items: center;
    background:rgba(0, 0, 0, .6);
    z-index: 1;
    .loading-bounder {
        width: 6px;
        height: 6px;
        background: #ffffff;
        border-radius: 50%;
        margin: 2px;
        -webkit-animation: loading 1.2s ease infinite;
        animation: loading 1.2s ease infinite;
        &.ball1 {
            -webkit-animation-delay: -0.32s;;
            animation-delay: -0.32s;;
        }
        &.ball2 {
            -webkit-animation-delay: -0.16s;
            animation-delay: -0.16s;
        }
    }
    @keyframes loading {
        0%, 40%, 100% {
            opacity: 1;
            transform: translateY(0px);
        }
        60% {
            opacity: 0.3;
            transform: translateY(-4px);
        }
    }
}
</style>
