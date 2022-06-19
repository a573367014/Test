<style lang="less">
    .eui-v2-background-image-button {
        width: 100%;
        height: 98px;

        background-repeat: no-repeat;
        background-size: 100% 100%;
        border-radius: @button-border-radius;
        border: 1px solid white;

        position: relative;
        margin: -1px;
        outline: none;
        cursor: pointer;

        &::before {
            position: absolute;
            content: ' ';
            z-index: 0;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.3);
            display: none;
            border-radius: @button-border-radius;
        }

        &__hover__text {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);

            border: none;
            border-radius: 16px;
            z-index: 1;
            color: black;
            padding: 7px 16px;
            font-size: 12px;
            line-height: 17px;
            background-color: white;
            display: none;
        }

        &:hover {
            &::before, .eui-v2-background-image-button__hover__text {
                display: inline-block;
            }
        }

        &[disabled] {
            cursor: not-allowed;
            &::before, .eui-v2-background-image-button__hover__text {
                display: none
            }
        }

        &:active, &.activated {
            border-color: @primary-color;
        }

        &.activated {
            &::before, .eui-v2-background-image-button__hover__text {
                display: none
            }
        }
    }
</style>

<template>
    <button class="eui-v2-background-image-button" :class="{ 'activated': activated }" :style="backgroundImage" v-on="$listeners">
        <div class="eui-v2-background-image-button__hover__text" v-if="hoverText">
            {{ hoverText }}
        </div>
        <slot />
    </button>
</template>

<script>

export default {
    props: {
        hoverText: {
            type: String,
            default: () => ''
        },
        image: {
            type: String,
            required: true
        },
        activated: {
            type: Boolean,
            default: () => false
        }
    },
    computed: {
        backgroundImage() {
            const { image } = this;
            return {
                backgroundImage: `url(${image})`
            };
        },
    }
};

</script>
