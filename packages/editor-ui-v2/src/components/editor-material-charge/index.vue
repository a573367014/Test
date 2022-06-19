<template>
    <div class="editor-material-charge">
        <slot />
        <div class="editor-material-charge__info" :class="infoClasses">
            <eui-v2-icon
                v-if="crownVisible"
                class="editor-material-charge__icon_crown"
                name="crown"
            />
            <!-- 如果不是免费素材，未 hover 也需要显示 -->
            <div v-if="!isFree" class="editor-material-charge__charge">
                <div class="eui-v2-icon icon-vip-diamond editor-material-charge__icon_vip" />
            </div>
            <div class="editor-material-charge__charge editor-material-charge__charge_response">
                <!-- hover 显示素材费用信息 -->
                <div v-if="!isFree && !isVip" class="eui-v2-icon icon-vip-diamond" />
                <span v-else>{{ materialCharge }}</span>
            </div>
        </div>
    </div>
</template>
<script>
import { i18n } from '../../i18n';

export default {
    props: {
        alignLeft: {
            type: Boolean,
            default: false,
        },
        material: {
            type: Object,
            default: () => ({
                level: 1,
            }),
        },
    },
    computed: {
        infoClasses() {
            const classes = [];
            // 小于某些高度时需要讲图标居左
            if (this.alignLeft) {
                classes.push('editor-material-charge__info_align-left');
            }
            // 不显示版权图标时需要居右
            else if (!this.crownVisible) {
                classes.push('editor-material-charge__info_align-right');
            }
            return classes;
        },
        crownVisible() {
            return this.material.type !== 'poster';
        },
        isVip() {
            return true;
        },
        isFree() {
            return this.material.vip === 0;
        },
        materialCharge() {
            return this.isFree ? i18n.$tsl('免费') : i18n.$tsl('VIP专享');
        },
    },
};
</script>
<style lang="less" scoped>
.editor-material-charge {
    position: relative;
    z-index: 1;
    display: flex;
    width: 100%;
    height: 100%;
    font-size: 12px;

    align-items: center;
    justify-content: center;

    &:hover {
        .editor-material-charge {
            &__charge {
                display: none;
                &_response {
                    display: block;
                }
            }

            &__icon_crown {
                opacity: 1;
            }
        }
    }
    &__info {
        position: absolute;
        bottom: 9px;
        left: 0;
        display: flex;
        width: 100%;
        padding: 0 8px;

        align-items: center;
        flex-wrap: wrap;
        justify-content: space-between;

        &_align-right {
            justify-content: flex-end;
        }
    }
    &__charge {
        padding: 2px 10px;
        border-radius: 12px;
        color: #fff;
        background: rgba(0, 0, 0, 0.6);

        &_response {
            display: none;
        }
    }

    &__icon_crown {
        font-size: 24px;
        opacity: 0;
    }
}
</style>
