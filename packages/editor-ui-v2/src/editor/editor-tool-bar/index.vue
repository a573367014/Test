<style lang="less">
.eui-v2-editor-tool-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
    color: #636c78;
    box-sizing: border-box;

    .eui-v2-icon {
        width: 16px;
        height: 16px;
        color: #636c78;
    }

    .eui-v2-buttons-bar {
        padding-left: 12px;
        padding-right: 12px;
        padding: 0 6px;
        background: #eff1f6;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 6px;
        box-sizing: border-box;
    }

    .eui-v2-editor-tool-bar-btn {
        padding-left: 4px !important;
        padding-right: 4px !important;
    }

    .eui-v2-buttons-bar,
    & .eui-v2-editor-tool-bar__comparison {
        height: 40px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(238, 242, 248, 0.9);
        border-radius: 6px;
    }

    .eui-v2-editor-tool-bar__comparison {
        padding: 9px 18px;
        margin-right: 8px;
        font-size: 14px;
        font-weight: 500;
        line-height: 1;
    }

    .eui-v2-buttons-bar__divide {
        height: 40px;
        margin-left: 6px;
        margin-right: 4px;
    }

    .eui-v2-editor-tool-bar__ctr {
        padding: 12px 4px;
    }

    &__zoom-button {
        width: 34px;
        font-size: 13px;
        line-height: 15px;
        transition: none;
        text-align: center;
        box-sizing: content-box;

        &.eui-v2-button {
            font-size: 14px;
        }

        .eui-v2-icon {
            display: none;
            margin: 0 auto;
        }

        &:hover {
            font-size: 0 !important;
            line-height: 0;

            .eui-v2-icon {
                display: block;
                font-size: 16px;
            }
        }
    }
}
</style>

<template>
    <div class="eui-v2-editor-tool-bar">
        <Button
            v-if="comparisonVisible"
            icon-type="only"
            fill="clear"
            :tooltip="$tsl('查看原图')"
            tooltip-side="top"
            class="eui-v2-editor-tool-bar__comparison"
            @mousedown="onMouseDown()"
            @mouseup="onMouseUp()"
        >
            {{ $tsl('对比') }}
        </Button>
        <ButtonsBar>
            <Button
                class="eui-v2-editor-tool-bar-btn"
                icon-type="only"
                fill="clear"
                @click="changeZoom('out')"
                :disabled="!canZoomOut"
                tooltip-side="top"
                :disabled-tooltip="$tsl('已缩小至最小画布')"
            >
                <Icon name="zoomout" />
            </Button>
            <Button
                fill="clear"
                @click="toggleZoomMode"
                class="eui-v2-editor-tool-bar-btn eui-v2-editor-tool-bar__zoom-button"
                icon-type="only"
                :tooltip="zoomModeText"
                tooltip-side="top"
            >
                <Icon :name="zoomModeIcon" />
                {{ zoomPercentage }}
            </Button>
            <Button
                class="eui-v2-editor-tool-bar-btn"
                icon-type="only"
                fill="clear"
                @click="changeZoom('in')"
                :disabled="!canZoomIn"
                tooltip-side="top"
                :disabled-tooltip="$tsl('已放大至最大画布')"
            >
                <Icon name="zoomin" />
            </Button>
            <template v-if="visualVisible">
                <Button
                    class="eui-v2-editor-tool-bar-btn"
                    icon-type="only"
                    fill="clear"
                    @click="toggleVisualActive"
                >
                    <Icon
                        name="plus"
                        :style="{
                            color: visualActive ? '#2254F4' : '#636c78',
                            fontSize: '20px',
                        }"
                    />
                </Button>
            </template>
        </ButtonsBar>
        <slot />
    </div>
</template>

<script>
import ButtonsBar from '../../base/buttons-bar';
import Button from '../../base/button';
import Icon from '../../base/icon';
import { i18n } from '../../i18n';

const ZOOM_MODE_FIT = 'modeFit';
const ZOOM_MODE_OFF = 'modeOff';

export default {
    components: {
        ButtonsBar,
        Button,
        Icon,
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        visualVisible: {
            type: Boolean,
            default: false,
        },
        visualActive: {
            type: Boolean,
            default: false,
        },
        comparisonVisible: {
            type: Boolean,
            default: false,
        },
        showOriginLayout: {
            type: Boolean,
            default: false,
        },
        manuallyClicked: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            zooms: [0.15, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4],
            timer: null,
        };
    },
    computed: {
        innerVisualActive: {
            get() {
                return this.visualActive;
            },
            set(visualActive) {
                this.$emit('update:visualActive', visualActive);
                this.$emit('update:manuallyClicked', visualActive);
            },
        },
        zoom() {
            return this.editor.global.zoom;
        },
        zoomPercentage() {
            const { zoom } = this;
            return `${Math.floor(zoom * 100)}%`;
        },
        canZoomIn() {
            const { zooms, zoom } = this;
            return zoom < zooms[zooms.length - 1];
        },
        canZoomOut() {
            const { zooms, zoom, fitZoom } = this;
            return zoom > zooms[0] || zoom > fitZoom;
        },
        zoomMode() {
            const { zoom } = this;
            return zoom === 1 ? ZOOM_MODE_FIT : ZOOM_MODE_OFF;
        },
        zoomModeText() {
            const { zoomMode } = this;
            return zoomMode === ZOOM_MODE_OFF ? i18n.$tsl('实际大小') : i18n.$tsl('适应屏幕');
        },
        zoomModeIcon() {
            const { zoomMode } = this;
            return zoomMode === ZOOM_MODE_OFF ? 'zoom-actual-size' : 'zoom-fit-screen';
        },
        fitZoom() {
            if (this.editor && this.editor.currentLayout) {
                return this.editor.calcFitZoom();
            }
            return 1;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        onMouseDown() {
            this.$emit('update:showOriginLayout', true);
        },
        onMouseUp() {
            this.$emit('update:showOriginLayout', false);
        },
        changeZoom(dir) {
            const { zooms, fitZoom } = this;
            const currZoom = this.editor.global.zoom;

            if (dir === 'out') {
                const hasZoommed = zooms
                    .slice()
                    .reverse()
                    .some((zoom) => {
                        if (currZoom > zoom) {
                            this.editor.zoomTo(zoom);
                            return true;
                        }
                    });
                if (!hasZoommed && currZoom > fitZoom) {
                    this.editor.zoomTo(fitZoom);
                }
                return;
            }

            if (dir === 'in') {
                zooms.some((zoom) => {
                    if (currZoom < zoom) {
                        this.editor.zoomTo(zoom);
                        return true;
                    }
                });
            }
        },
        toggleZoomMode() {
            const mode = this.zoomMode;
            if (mode === ZOOM_MODE_FIT) {
                this.editor.fitZoom();
            } else {
                this.editor.zoom = 1;
            }
        },
        toggleVisualActive() {
            this.innerVisualActive = !this.innerVisualActive;
        },
    },
};
</script>
