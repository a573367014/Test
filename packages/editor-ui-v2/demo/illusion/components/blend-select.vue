<template>
    <div class="select-container">
        <PopBase
            class="eui-v2-panel-pop-layer"
            ref="pop"
            @active="onPopActive"
        >
            <div class="eui-v2-panel-pop-picker-label">
                {{ currentLabel }}
            </div>
            <div slot="panel" class="select-group" v-for="(group, index) in list" :key="index">
                <SelectPanel :onSelect="select" :list="group.list" />
                <div class="select-group--line"></div>
            </div>
        </PopBase>
        <div></div>
    </div>
</template>

<script>
import { PopBase } from '../../src';
import SelectPanel from './select-panel';

export default {
    components: {
        PopBase,
        SelectPanel
    },

    props: {
        list: {
            type: Array,
            default: () => [{ label: 'ada' }],
        },

        onSelect: {
            type: Function,
            default: () => {},
        }
    },

    data() {
        return {
            current: {
                label: '请选择'
            }
        };
    },

    computed: {
        currentLabel() {
            const { current } = this;

            return current.label;
        }
    },

    methods: {
        onPopActive() {
        },

        onPopHide() {
        },

        select(item) {
            this.current = item;

            if(typeof this.onSelect === 'function') {
                this.onPopHide();
                this.onSelect(item);
            }
        }
    },

    mounted() {
    }
};
</script>

<style lang="less">
.select-container {
    display: flex;
    height: 38px;
}
.eui-v2-panel-pop-layer {
    width: 90px;
    .eui-v2-pop-label {
        margin: 0;
        border: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 20px;
        cursor: pointer;
    }
    .eui-v2-pop-panel {
        top: 10px;
        z-index: 1;
        width: 130px;
        border-radius: 4px;
        background: white;
        border: 1px solid #D3D8DD;
        box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.06);
    }
    .eui-v2-panel-pop-picker-label {
        font-size: 12px;
    }
}
.select-group:last-child {
    .select-group--line {
        display: none;
    }
}
.select-group--line {
    width: 100%;
    height: 1px;
    background-color: #D3D8DD;
    margin: 5px 0;
}
</style>
