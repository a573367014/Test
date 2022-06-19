<template>
    <div class="performance">
        <div class="performance__fps">
            <div style="display: flex; justify-content: space-between">
                <div :style="{ color: fpsSource < 40 ? 'red' : '#10f510' }">FPS: {{ fps }}</div>
                <div>FPS评分：{{ fpsSource }}</div>
            </div>
            <div class="performance__fps_list">
                <div
                    class="performance__fps_list__item"
                    v-for="(item, index) in lastFpsList"
                    :key="index"
                    :style="{ height: (item / 60) * 30 + 'px' }"
                >
                    <!-- {{ item }} -->
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        fpsList: {
            type: Array,
            default: () => [40, 50],
        },
    },
    computed: {
        fps() {
            if (this.fpsList.length === 0) {
                return 0;
            }
            return this.fpsList[this.fpsList.length - 1];
        },
        fpsSource() {
            if (this.fpsList.length === 0) {
                return 0;
            }
            const lastList = this.fpsList.filter((_item, _idx) => {
                return _idx > this.fpsList.length - 30;
            });
            const total = lastList.reduce((pre, item) => {
                return pre + item;
            }, 0);
            return Math.floor((total / lastList.length / 60) * 100);
        },
        lastFpsList() {
            if (this.fpsList.length > 20) {
                return this.fpsList.filter((_item, _idx) => {
                    return _idx > this.fpsList.length - 20;
                });
            }
            return this.fpsList;
        },
    },
};
</script>

<style lang="less">
.performance {
    position: fixed;
    top: 1px;
    right: 1px;
    width: 180px;
    padding: 1px;
    // height: 80px;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999;
    opacity: 0.8;
    &__fps {
        color: white;
    }
    &__fps_list {
        display: flex;
        align-items: flex-end;
        &__item {
            width: 10px;
            background-color: white;
        }
    }
}
</style>
