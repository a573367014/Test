<template>
    <div class="toggle-tabs-bar">
        <div class="eui-v2-tabs__header">
            <div
                v-for="(item, index) in tabs"
                :key="item.name"
                class="toggle-tab-btn"
                :class="{ 'toggle-tab-btn-active': index === activedIndex }"
                @click="tabClick(item, index)"
            >
                <component
                    v-if="item.component"
                    :is="item.component"
                    :content="item.content"
                    :active="index === activedIndex"
                    v-bind="$attrs"
                ></component>
                <tab v-else class="eui-v2-tab-btn" :content="item.content" :name="item.name" />
            </div>
            <div class="eui-v2-tab-bg" :style="getTabBgStyle"></div>
        </div>
    </div>
</template>

<script>
import tab from '../../base/tab';

export default {
    components: {
        tab,
    },
    props: {
        tabs: {
            type: Array,
            required: true,
        },
        value: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            activedIndex: 0,
        };
    },
    computed: {
        getTabBgStyle() {
            const { tabs, activedIndex } = this;
            const width = 100 / tabs.length;
            return {
                width: `${width}%`,
                left: `calc(${activedIndex * width}%)`,
            };
        },
    },
    watch: {
        value: function () {
            this.setDefaultActive();
        },
    },
    created() {
        this.setDefaultActive();
    },
    methods: {
        setDefaultActive() {
            this.tabs.forEach((el, index) => {
                if (el.name === this.value) {
                    this.activedIndex = index;
                }
            });
        },
        tabClick(item, index) {
            this.activedIndex = index;
            this.$emit('change', item.name);
        },
    },
};
</script>

<style lang="less">
.toggle-tabs-bar {
    padding: 2px;
    background: #f6f7f9;
    border-radius: 6px;

    .eui-v2-tabs__header {
        display: flex;
        justify-content: space-between;
        padding: 0;
        background: #f6f7f9;
        border-bottom: none;
    }
    .toggle-tab-btn {
        overflow: hidden;
        flex: 1;
        z-index: 2;
        color: #33383e;
        font-size: 14px;
        border-radius: 4px;
        cursor: pointer;

        &-active {
            font-weight: 600;

            .eui-v2-tab-btn {
                font-size: 14px;
                font-weight: 600;
            }
        }
    }
    .eui-v2-tab {
        padding: 6px 0;
        width: 100%;
        background-color: transparent;
        padding: 6px 0;
        font-size: 14px;
        line-height: 20px;
    }

    .eui-v2-tab-btn {
        font-family: auto;
        font-size: 14px;
        color: #636c78;
    }
    .eui-v2-tab-bg {
        position: absolute;
        top: 0;
        bottom: 0;
        background: #ffffff;
        box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.12);
        border-radius: 4px;
        z-index: 1;
        transition: left 0.2s ease-in-out;
    }
}
</style>

<template>
    <div class="toggle-tabs-bar">
        <div class="eui-v2-tabs__header">
            <div
                v-for="(item, index) in tabs"
                :key="item.name"
                class="toggle-tab-btn"
                :class="{ 'toggle-tab-btn-active': index === activedIndex }"
                @click="tabClick(item, index)"
            >
                <component
                    v-if="item.component"
                    :is="item.component"
                    :content="item.content"
                    :active="index === activedIndex"
                    v-bind="$attrs"
                ></component>
                <tab v-else class="eui-v2-tab-btn" :content="item.content" :name="item.name" />
            </div>
            <div class="eui-v2-tab-bg" :style="getTabBgStyle"></div>
        </div>
    </div>
</template>

<script>
import tab from '../../base/tab/index.vue';

export default {
    components: {
        tab,
    },
    props: {
        tabs: {
            type: Array,
            required: true,
        },
        value: {
            type: String,
            default: null,
        },
        canToggle: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            activedIndex: 0,
        };
    },
    computed: {
        getTabBgStyle() {
            const { tabs, activedIndex } = this;
            const width = 100 / tabs.length;
            return {
                width: `${width}%`,
                left: `calc(${activedIndex * width}%)`,
            };
        },
    },
    watch: {
        value: function () {
            this.setDefaultActive();
        },
    },
    created() {
        this.setDefaultActive();
    },
    methods: {
        setDefaultActive() {
            this.tabs.forEach((el, index) => {
                if (el.name === this.value) {
                    this.activedIndex = index;
                }
            });
        },
        tabClick(item, index) {
            if (!this.canToggle) return;
            this.activedIndex = index;
            this.$emit('change', item.name);
        },
    },
};
</script>
