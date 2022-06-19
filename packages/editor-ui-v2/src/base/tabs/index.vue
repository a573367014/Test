<style lang="less">
.eui-v2-tabs {
    &--panel,
    &--float {
        > .eui-v2-tabs__header {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            z-index: 2;
        }
    }

    &--panel {
        position: relative;
    }

    &--float {
        position: static;

        .eui-v2-tabs__panel {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            overflow: auto;
        }
    }

    &__header {
        position: relative;
        display: flex;
        justify-content: space-around;
        align-items: center;
        background-color: @white-color;
        border-bottom: 1px solid @main-background-color;
        box-sizing: border-box;
        padding: 0 30px;
    }

    &__line {
        position: absolute;
        width: 32px;
        height: 2px;
        bottom: 0;
        background-color: black;
        transition: left 0.2s ease-out;
    }

    &--single {
        padding: 0 8px;
        justify-content: left;

        .eui-v2-tab {
            cursor: unset;
        }

        .eui-v2-tabs__line {
            display: none;
        }
    }

    &__panel {
        padding-top: 58px;
    }
}
</style>

<script>
import Tab from '../tab';

export default {
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        value: {
            type: String,
            default: null,
        },
        hideLine: {
            type: Boolean,
            default: false,
        },
        floatTab: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            lineShow: false,
            lineLeft: 0,
        };
    },
    computed: {
        activeLineStyle() {
            const { lineShow, lineLeft, hideLine } = this;
            if (lineShow && !hideLine) {
                return {
                    left: `${lineLeft}px`,
                };
            }

            return {
                display: 'none',
            };
        },
    },
    watch: {
        value: function () {
            this.$nextTick(() => {
                this.onValueChange();
            });
        },
    },
    mounted() {
        this.$on('tab.disabledChange', (tab) => {
            if (tab.disabled && this.value === tab.name) {
                let name = '';
                this.$children.some((children) => {
                    if (children.name !== tab.name && !children.disabled) {
                        name = children.name;
                        return true;
                    }
                });
                this.$emit('change', name);
            }
        });
    },
    methods: {
        onTabClick(node) {
            return (event) => {
                const instance = node.componentInstance;
                if (instance.name !== this.value && !instance.disabled) {
                    this.$emit('change', instance.name, event);
                    if (this.$refs.panel) {
                        this.$refs.panel.scrollTop = 0;
                        this.$refs.panel.scrollLeft = 0;
                    }
                }
            };
        },
        onValueChange() {
            const { value } = this;
            let hasTabActive = false;
            this.lineShow = this.$children.length > 0;
            this.$children.forEach((tab) => {
                tab.activated = false;
                if (tab.name === value) {
                    const { left: parentLeft } = this.$refs.headers.getBoundingClientRect();
                    const { left, width } = tab.$el.getBoundingClientRect();
                    const lineLeft = (left + width + left - 32) / 2 - parentLeft;
                    this.lineShow = true;
                    this.lineLeft = lineLeft;
                    tab.activated = true;
                    hasTabActive = true;
                }
            });

            if (!hasTabActive) {
                const tab = this.$children[0];
                if (tab) {
                    const { left: parentLeft } = this.$refs.headers.getBoundingClientRect();
                    const { left, width } = tab.$el.getBoundingClientRect();
                    const lineLeft = (left + width + left - 32) / 2 - parentLeft;
                    tab.activated = true;
                    this.$emit('change', tab.name);
                }
            }
        },
    },
    render(h) {
        const { floatTab } = this;
        const vNodes = this.$scopedSlots.default
            ? this.$scopedSlots.default()
            : this.$slots.default || [];
        const panelNodes = this.$scopedSlots.panel ? this.$scopedSlots.panel() : this.$slots.panel;
        const filterNodes = vNodes.filter(
            (node) => node.componentOptions && node.componentOptions.Ctor === Tab._Ctor[0],
        );

        const panel =
            panelNodes && panelNodes.length ? (
                <div class="eui-v2-tabs__panel" ref="panel">
                    {...panelNodes}
                </div>
            ) : null;

        this.$nextTick(() => {
            this.onValueChange();
        });
        return (
            <div
                class={[
                    'eui-v2-tabs',
                    panel ? 'eui-v2-tabs--panel' : '',
                    floatTab ? 'eui-v2-tabs--float' : '',
                ]}
            >
                <div
                    ref="headers"
                    class={[
                        'eui-v2-tabs__header',
                        filterNodes.length === 1 ? 'eui-v2-tabs--single' : '',
                    ]}
                >
                    {filterNodes.map((node) => (
                        <div on-click={this.onTabClick(node)}>{node}</div>
                    ))}
                    <div class="eui-v2-tabs__line" style={this.activeLineStyle} />
                </div>
                {panel}
            </div>
        );
    },
};
</script>
