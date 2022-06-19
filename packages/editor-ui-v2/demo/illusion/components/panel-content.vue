<template>
    <div class="panel-content" v-show="visible">
        <div class="panel-title" title="点击展开收起" @click="toggleCollapse"><check-box v-model="isCheck"></check-box>{{ title }}</div>
        <div class="panel-body" v-show="isCollapsed">
            <slot></slot>
        </div>
    </div>
</template>

<script>
import CheckBox from '../../src/checkbox';

export default {
    components: {
        CheckBox
    },

    props: {
        checked: {
            type: Boolean,
            default: false,
        },

        collapsed: {
            type: Boolean,
            default: false,
        },

        visible: {
            type: Boolean,
            default: false,
        },

        title: {
            type: String,
            default: '基础'
        }
    },

    watch: {
        isCheck(val) {
            this.$emit('update:checked', val);
        },
        isCollapsed(val) {
            this.$emit('update:collapsed', val);
        }
    },

    data() {
        return {
            isCheck: false,
            isCollapsed: false,
        };
    },

    methods: {
        toggleCollapse() {
            this.isCollapsed = !this.isCollapsed;
        }
    },

    created() {
        this.isCheck = this.checked;
        this.isCollapsed = this.collapsed;
    }
};
</script>

<style lang="less">
.eui-v2-collapse-container {
    position: static;
}
.eui-v2-collapse-container .eui-v2-collapse-panel {
    width: 100%;
    background-color: #FFFFFF;
}
.panel-content {
    width: 236px;
    margin-top: 15px;
    > .panel-title {
        font-size: 15px;
        font-weight: 500;
        color: #000000;
        line-height: 21px;
        margin-bottom: 10px;
        cursor: pointer;
    }
    .panel-body {
        width: 236px;
        border-radius: 4px;
        border: 1px solid #DFE3ED;
    }
}
</style>
