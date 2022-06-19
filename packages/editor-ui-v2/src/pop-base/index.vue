<template>
    <div
        class="eui-v2-pop"
        :class="{'is-active': actived}"
    >
        <div
            class="eui-v2-pop-label"
            @click="toggleActive"
            :class="{'font-active': fontActived}"
        >
            <Loading class="eui-v2-pop-loading" :showLoading="fontActived"/>
            <slot></slot>
        </div>

        <div class="eui-v2-pop-panel" v-if="actived">
            <slot name="panel"></slot>
        </div>

        <slot name="pop"></slot>
    </div>
</template>
<script>
import isEditable from './is-editable';
import Loading from './loading';
export default {
    components: {
        Loading
    },
    props: {
        scopeLocked: { type: Boolean, default: false },
        fontActived: { type: Boolean, default: false }
    },
    data() {
        return {
            actived: false
        };
    },
    created() {
        this.$on('destroy', this.removeDocEvts);
    },
    beforeDestroy() {
        this.$emit('destroy');
    },
    methods: {
        active() {
            if(this.actived) {
                return;
            }

            this.actived = true;

            this.$emit('active');

            setTimeout(() => {
                const onDocClick = this.onDocClick;

                document.addEventListener('click', onDocClick, false);
            }, 32);
        },
        inactive() {
            if(!this.actived) {
                return;
            }

            this.actived = false;

            this.removeDocEvts();
            this.$emit('inactive');
        },
        toggleActive(e) {
            const target = e && e.target;

            if(this.actived && !isEditable(target)) {
                this.inactive();
            }
            else {
                this.active();
            }
        },
        onDocClick(e) {
            const el = this.$el;
            const target = e.target;

            if(
                this.changing || (this.scopeLocked &&
                (
                    el === target ||
                    (el.compareDocumentPosition(target) & 16)
                ))
            ) {
                return;
            }

            this.inactive();
        },
        removeDocEvts() {
            const onDocClick = this.onDocClick;

            document.removeEventListener('click', onDocClick, false);
        }
    }
};
</script>

<style lang="less">


.eui-v2-pop {
    box-sizing: border-box;
    width: 100%;
    &.is-active {
        .btn-tips::before,
        .btn-tips::after {
            display: none;
        }
    }
    ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    li {
        padding: 0;
    }

    em {
        font-style: normal;
        font-size: 14px;
    }
}
.eui-v2-pop-panel {
    box-sizing: border-box;
    position: relative;
    left: 0;
    top: -10px;
}
.eui-v2-pop-label {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    margin: 11px auto 11px;
    padding-left: 10px;
    width: 100%;
    height: 38px;
    border: 1px solid #DFE3ED;
    border-radius: 2px;
    position: relative;
    cursor: pointer;
    &:hover {
        border-color: #c6cad5;
    }
    &::after {
        content: '';
        width: 10px;
        height: 10px;
        position: absolute;
        right: 10px;
        top: 16px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid #626A77;
    }
    &.font-active {
        &::after {
            display: none;
        }
        .eui-v2-pop-loading {
            position: absolute;
            right: 10px;
            width: 24px;
            background: #fff;
            .loading-bounder {
                width: 4px;
                height: 4px;
                background-color: @primary-color;
                margin: 1px;
            }
        }
    }
    .eui-v2-pop-picker-label {
        padding-left: 6px;
    }
}

.eui-v2-panel-pop-label {
    width: 152px;
    .eui-v2-pop-picker-label {
        padding: 0;
        em {
            width: 100%;
        }
    }
}
.eui-v2-pop-panel-inner {
    right: 0;
}
</style>
