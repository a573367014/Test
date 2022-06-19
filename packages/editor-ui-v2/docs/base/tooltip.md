# tooltip 文字提示

:::demo
<style lang="less">
    .tooltip-demo {
        &__row {
            display: flex;


            &--left {
                justify-content: left;
                flex-grow: 1;
                text-align: left;
            }
            &--center {
                justify-content: center;
                flex-grow: 1;
                text-align: center;
            }

            &--right {
                justify-content: right;
                flex-grow: 1;
                text-align: right;
            }
        }
    }
</style>

<template>
    <div class="tooltip-demo">
        <div class="tooltip-demo__row">
            <div class="tooltip-demo__row--center">
                <eui-v2-tooltip content="上左" placement="top-start">
                    <eui-v2-button>上左</eui-v2-button>
                </eui-v2-tooltip>
                <eui-v2-tooltip content="上中" placement="top-center">
                    <eui-v2-button>上中</eui-v2-button>
                </eui-v2-tooltip>
                <eui-v2-tooltip content="上右" placement="top-end">
                    <eui-v2-button>上右</eui-v2-button>
                </eui-v2-tooltip>
            </div>
        </div>
        <div class="tooltip-demo__row">
            <div class="tooltip-demo__row--left">
                <eui-v2-tooltip content="左上" placement="left-start">
                    <eui-v2-button>左上</eui-v2-button>
                </eui-v2-tooltip>
            </div>
            <div class="tooltip-demo__row--right" >
                <eui-v2-tooltip content="右上" placement="right-start">
                    <eui-v2-button>右上</eui-v2-button>
                </eui-v2-tooltip>
            </div>
        </div>
        <div class="tooltip-demo__row">
            <div class="tooltip-demo__row--left">
                <eui-v2-tooltip content="左中" placement="left-center">
                    <eui-v2-button>左中</eui-v2-button>
                </eui-v2-tooltip>
            </div>
            <div class="tooltip-demo__row--right" >
                <eui-v2-tooltip content="右中" placement="right-center">
                    <eui-v2-button>右中</eui-v2-button>
                </eui-v2-tooltip>
            </div>
        </div>
        <div class="tooltip-demo__row">
            <div class="tooltip-demo__row--left">
                <eui-v2-tooltip content="左下" placement="left-end">
                    <eui-v2-button>左下</eui-v2-button>
                </eui-v2-tooltip>
            </div>
            <div class="tooltip-demo__row--right" >
                <eui-v2-tooltip content="右下" placement="right-end">
                    <eui-v2-button>右下</eui-v2-button>
                </eui-v2-tooltip>
            </div>
        </div>
        <div class="tooltip-demo__row">
            <div class="tooltip-demo__row--center">
                <eui-v2-tooltip content="下左" placement="bottom-start">
                    <eui-v2-button>下左</eui-v2-button>
                </eui-v2-tooltip>
                <eui-v2-tooltip content="下中" placement="bottom-center">
                    <eui-v2-button>下中</eui-v2-button>
                </eui-v2-tooltip>
                <eui-v2-tooltip content="下右" placement="bottom-end">
                    <eui-v2-button>下右</eui-v2-button>
                </eui-v2-tooltip>
            </div>
        </div>
    </div>
</template>

<script>

export default {}
</script>
:::