<template>
    <div :class="['juggle-item', action ? 'juggle-item__action' : '']" :style="{ left: leftValue + 'px', top: topValue + 'px' }" @mousedown.stop="handleClick($event)">
        <slot></slot>
    </div>
</template>

<script>
export default {
    props: {
        top: {
            type: Number,
            default: 0,
        },
        left: {
            type: Number,
            default: 0,
        },
        action: {
            type: Boolean,
            default: false
        }
    },
    data: function () {
        return {
            topValue: this.top,
            leftValue: this.left,
        };
    },
    watch: {
        top: function (val) {
            this.topValue = val
        },
        left: function (val) {
            this.leftValue = val;
        }
    },
    methods: {
        handleClick(event) {
            console.log('handleClick', event);
            let startX = event.clientX;
            let startY = event.clientY;
            const move = (event) => {
                const dx = event.clientX - startX;
                const dy = event.clientY - startY;
                startX = event.clientX;
                startY = event.clientY;
                this.topValue = this.topValue + dy;
                this.leftValue = this.leftValue + dx;
                console.log('left:', this.leftValue, 'top: ', this.topValue);
            }
            const up = (event) => {
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', up)
            }
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        }
    }
};
</script>

<style lang="less">
.juggle-item {
    position: absolute;
    background: #fff;
    cursor: pointer;
    .ge-music-item {
        background: #fff;
    }
    &__action {
        transition: top 0.6s ease-out, left 0.6s ease-out,;
    }
}
</style>
