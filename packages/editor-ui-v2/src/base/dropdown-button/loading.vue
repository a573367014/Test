@@ -0,0 +1,49 @@
<template>
    <div class="eui-v2-loading-container" >
        <span class="eui-v2-loading-container__bounder ball1" />
        <span class="eui-v2-loading-container__bounder ball2" />
        <span class="eui-v2-loading-container__bounder ball3" />
    </div>
</template>

<style lang="less">

.eui-v2-loading-container {
    height: 22px;
    border-radius: 11px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;

    &__bounder {
        width: 4px;
        height: 4px;
        background: @primary-color;
        border-radius: 50%;
        margin: 1px;
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
