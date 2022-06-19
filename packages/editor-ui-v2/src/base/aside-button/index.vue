<style lang="less">
    .eui-v2-aside-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        position: relative;
        padding: 12px 0;
        font-size: 12px;
        font-weight: 500;
        line-height: 17px;
        color: #B4B8BF;
        background: white;
        border: none;
        outline: none;
        width: 100%;
        cursor: pointer;
        border-radius: 0;
        word-break: break-all;
        user-select: none;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 14px;
            height: 40px;
            width: 3px;
            background-color: @primary-color;
            display: none;
        }

        &:hover {
            &::before {
                display: block;
            }
        }

        &:active,
        &.activated {
            &::before {
                display: block;
            }
            .eui-v2-icon {
                color: @primary-color;
            }
            color: @primary-color;
        }

        .eui-v2-icon {
            display: block;
            margin: 0 auto 4px;
            font-size: 24px;
            color: #070707;
        }

        &--small {
            font-size: 0;
            line-height: 0;

            &::before {
                top: 10px;
                height: auto;
                bottom: 10px;
            }

            .eui-v2-icon {
                margin: 0 auto;
            }
        }
        &-text {
            position: absolute;
            width: 36px;
            height: 20px;
            line-height: 19px;
            top: 0px;
            right: 2px;
            font-size: 12px;
            text-align: center;
            background-image: url(../icon/icons/default-tag.svg);
            background-size: contain;
            background-repeat: no-repeat;
            color: #fff;
        }
    }

</style>

<script>
import Tooltip from '../tooltip';
import AsideContainer from '../aside-container';

export default {
    props: {
        tag: {
            type: String,
            default: 'button'
        },
        content: {
            type: String,
            default: '',
        },
        activated: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        small() {
            return false;
            // const parent = this.getParent(this.$parent);
            // return parent && parent.smallMode;
        }
    },
    methods: {
        getParent(vm) {
            if(vm && vm.$vnode) {
                const Ctor = vm.$vnode.componentOptions.Ctor;
                if(AsideContainer._Ctor && Ctor === AsideContainer._Ctor[0]) {
                    return vm;
                }

                return this.getParent(vm.$parent);
            }
            return null;
        }
    },
    render(h) {
        const { tag, content, small, activated } = this;
        const vNodes = this.$scopedSlots.default ? this.$scopedSlots.default() : this.$slots.default;
        const textVodes = this.$scopedSlots.text ? this.$scopedSlots.text() : this.$slots.text;

        const childNodeList = [...vNodes];
        if(textVodes) {
            childNodeList.push(
                h('div', {
                    class: ['eui-v2-aside-button-text']
                }, textVodes)
            );
        }


        const element = h(tag, {
            class: ['eui-v2-aside-button', small ? 'eui-v2-aside-button--small' : '', activated ? 'activated' : ''],
            on: this.$listeners
        }, childNodeList);

        if(small && content) {
            return (
                <Tooltip placement="right-center" content={content} boundariesPadding={-10}>
                    { element }
                </Tooltip>
            );
        }
        return element;
    },
};
</script>
