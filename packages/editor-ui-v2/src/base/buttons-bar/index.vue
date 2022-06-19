<style lang="less">
    .eui-v2-buttons-bar {
        display: inline-flex;
        justify-content: left;
        align-items: center;
        flex-direction: row;
        font-size: 12px;
        line-height: 17px;
        position: relative;

        &--block {
            width: 100%;
        }

        &--outline {
            border: @button-border;
            border-radius: @button-border-radius;
        }

        &--clear {
            border: none;

            .eui-v2-button {
                border: none;
                margin: 0;
            }
        }

        &--dropdown {
            border: none;

            .eui-v2-dropdown-button {

                &__suffix {
                    position: static;
                    transform: none;
                    padding: 7px 14px 8px;
                }
            }
        }

        &__divide {
            box-sizing: border-box;
            border-left: @button-border;
            width: 0;
            height: 20px;
        }

        .eui-v2-button {
            margin: 0;
            margin-left: -1px;
            border-radius: 0;
            z-index: 1;
            display: block;
            // transform: translate3d(0, 0, 0);
            padding-left:4px;
            padding-right: 4px;

            &:hover {
                z-index: 2;
                // transform: translate3d(0, 0, 0);
            }
        }

        .eui-v2-button:first-child {
            margin-left: 0;
            border-top-left-radius: @button-border-radius;
            border-bottom-left-radius: @button-border-radius;
        }

        .eui-v2-button:last-child {
            border-top-right-radius: @button-border-radius;
            border-bottom-right-radius: @button-border-radius;
        }

        .eui-v2-text {
            padding: 12px;
            font-size: 12px;
            line-height:17px;
        }
    }
</style>

<script>
import { isArray } from 'lodash';

export default {
    props: {
        justify: {
            type: String,
            default: function() {
                return 'left';
            }
        },
        block: {
            type: Boolean,
            default: function() {
                return false;
            }
        },
        fill: {
            type: String,
            default: ''
        }
    },

    computed: {
        styles: function() {
            const { justify } = this;
            return {
                justifyContent: justify
            };
        },
    },

    render: function(h) {
        const {
            block,
            fill
        } = this;

        const vNodes = this.$slots.default;
        const buttons = [];

        if(isArray(vNodes) && vNodes.length) {
            vNodes.forEach(vNode => {
                if(vNode.tag) {
                    const tag = vNode.tag.toLowerCase();
                    if(tag.includes('eui-v2-divide-line')) {
                        buttons.push((
                            <div class="eui-v2-buttons-bar__divide"></div>
                        ));
                        return;
                    }
                }
                buttons.push(vNode);
            });
        }

        return (
            <div
                style={this.styles}
                class={[ 'eui-v2-buttons-bar', fill ? `eui-v2-buttons-bar--${fill}` : '', { 'eui-v2-buttons-bar--block': block } ]}>
                { buttons }
            </div>
        );
    }
};

</script>
