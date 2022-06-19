<template>
    <div
        class="ge-image__container"
        @mousemove.stop="handleCheckBoxMouseMove"
        @mouseleave.stop="handleCheckBoxMouseLeave"
        :style="{ width: _width, height: _height }"
    >
        <g-checkbox
            v-if="showCheck && !uploadStatus"
            @mousedown.native.stop
            class="ge-image__container__checkBox"
            :style="{ display: checkboxDisplay }"
            :checked="checked"
            @change="handleCheckedChange"
        ></g-checkbox>
        <div v-if="checked" class="ge-image__container__check"></div>
        <div :class="['ge-image', { 'ge-image__background--mark': showMark }]">
            <img
                v-if="src"
                class="ge-image__img"
                ref="geImage"
                :loading="lazy ? 'lazy' : ''"
                :src="src"
                draggable="false"
                @error="handleError"
                @load="handleLoad"
                @abort="handleError"
            />
            <div v-else class="ge-image--default"></div>

            <div class="ge-image__bottom-left-corner">
                <!-- 左下角自定义内容 -->
                <slot name="bottom_left_corner"></slot>
            </div>

            <div class="ge-image__bottom-right-corner">
                <!-- 右下角自定义内容 -->
                <slot name="bottom_right_corner"></slot>
            </div>
            <!-- 更多弹层 -->
            <div v-if="showMore" @mousedown.stop class="ge-image__more">
                <g-popover
                    v-ge-click-outside="hide"
                    :visible="visible"
                    placement="bottomLeft"
                    trigger="click"
                    overlayClassName="ge-image__tip"
                >
                    <div slot="content">
                        <!-- 图片弹层主内容插槽 -->
                        <slot name="popoverContent" />
                    </div>
                    <template slot="title">
                        <!-- 图片弹层头部内容插槽 -->
                        <slot name="popoverTitle" />
                    </template>
                    <ge-icon type="more" @click="visible = true" />
                </g-popover>
            </div>
            <!-- 选择态 -->
            <div v-if="!showCheck" class="ge-image__top-left-corner">
                <!--左上角自定义内容 -->
                <slot name="top_left_corner"></slot>
            </div>
        </div>
        <div class="ge-image__container__skeleton" v-if="loadStatus === 'loading' && src" />
        <!-- 上传态 -->
        <div class="ge-image__container__upload" v-if="uploadStatus">
            <div class="ge-image__container__upload--status">
                <template v-if="uploadStatus && !isUploadError">
                    <span class="ge-image__container__upload--status__text--uploading">
                        {{ uploadStatusText }}
                    </span>
                    <g-progress
                        :percent="uploadPercent"
                        strokeColor="#fff"
                        :showInfo="false"
                        size="small"
                    />
                </template>
                <template v-if="isUploadError">
                    <ge-icon
                        type="clear_circle_fill"
                        class="ge-image__container__upload--icon"
                        @click="handleDelete"
                    />

                    <span class="ge-image__container__upload--status__text--error">上传失败</span>
                    <p class="ge-image__container__upload--retry" @click="handleRetryUpload">
                        重试
                    </p>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, watch } from '@vue/composition-api';
import { UploadStatus } from '../../../types/image';
import { once } from '../../../utils/index';
import Popover from '@gaoding/gd-antd/es/popover';
import Checkbox from '@gaoding/gd-antd/es/checkbox';
import Progress from '@gaoding/gd-antd/es/progress';

const UPLOADING: UploadStatus = 'uploading';
const UPLOADERROR: UploadStatus = 'error';

const UPLOAD_STATUS_MAP = {
    uploading: '上传中',
    error: '上传失败',
    uploadingWithResizing: '压缩上传中',
    transcoding: '转码中',
    compressing: '压缩中',
};

/**
 * @title 组件名
 * GeImage
 */
/**
 * @title 描述
 * 编辑器通用图片组件
 */
/**
 * @title 使用场景
 * 侧边栏资源库资源元素展示
 * @dot 图片展示
 * @dot 版权角标定义
 * @dot vip 角标定义
 * @dot 选中状态
 */

export default defineComponent({
    name: 'GeImage',
    components: {
        GPopover: Popover,
        GCheckbox: Checkbox,
        GProgress: Progress,
    },
    props: {
        /**
         * 图片宽度
         */
        width: {
            type: [Number, String],
            default: '',
        },
        /**
         * 图片高度
         */
        height: {
            type: [Number, String],
            default: '',
        },
        /**
         * 图片url 对应原生属性sec
         */
        src: {
            type: String,
            default: '',
        },
        /**
         * 是否展示背景网格
         */
        showMark: {
            type: Boolean,
            default: true,
        },
        /**
         * 是否展示选择
         */
        showCheck: {
            type: Boolean,
            default: false,
        },
        /**
         * 是否展示更多
         */
        showMore: {
            type: Boolean,
            default: true,
        },
        /**
         * 当前选中态, 打开showCheck下生效
         */
        checked: {
            type: Boolean,
            default: false,
        },
        /**
         * 上传进度
         */
        uploadPercent: {
            type: Number,
            default: 0,
        },
        /**
         * 上传状态
         * OptionalValue: 'uploading' , 'error' , 'transcoding' , 'compressing'
         * Type: String
         */
        uploadStatus: {
            type: String as PropType<UploadStatus>,
            default: '',
        },
        /**
         * 父容器class
         */
        getPopupContainer: {
            type: Function as PropType<() => any>,
            default: () => ({}),
        },
        /**
         * 是否懒加载
         */
        lazy: {
            type: Boolean,
            default: true,
        },
    },
    emits: [
        /**
         * 上传失败重试回调
         */
        'retryUpload',
        /**
         * 文件删除时回调
         */
        'delete',
        /**
         * 选择态变化时回调
         * @param {Event} event
         */
        'checkChange',
    ],
    setup(props, { emit }) {
        const isUploading = computed(() => props.uploadStatus === UPLOADING);
        const isUploadError = computed(() => props.uploadStatus === UPLOADERROR);
        const uploadStatusText = computed(() => UPLOAD_STATUS_MAP[props.uploadStatus]);
        const checkboxDisplay = ref('none');
        const isOverImage = ref(false); // 是否处于图框内
        const visible = ref(false);
        const loadStatus = ref('loading');
        const _width = computed(() => {
            if (typeof props.width === 'string') {
                return props.width;
            }
            return `${props.width}px`;
        });
        const _height = computed(() => {
            if (typeof props.height === 'string') {
                return props.height;
            }
            return `${props.height}px`;
        });
        function handleRetryUpload() {
            // 上传失败重试
            // @arg void
            emit('retryUpload');
        }
        function handleDelete() {
            // 文件删除
            // @arg void
            emit('delete');
        }
        function handleCheckedChange(e: Event) {
            // 选择态变化
            // @arg event
            emit('checkChange', e);
        }
        function handleCheckBoxMouseMove() {
            isOverImage.value = true;
            if (!props.showCheck) return;
            checkboxDisplay.value = 'block';
        }
        function handleCheckBoxMouseLeave() {
            isOverImage.value = false;
            if (!props.showCheck || props.checked) {
                return;
            }

            checkboxDisplay.value = 'none';
        }
        function hide() {
            visible.value = false;
        }
        function handleLoad() {
            loadStatus.value = 'load';
        }
        function handleError() {
            loadStatus.value = 'error';
        }
        watch(
            () => props.checked,
            () => {
                if (props.checked) {
                    checkboxDisplay.value = 'block';
                } else {
                    if (!isOverImage.value) {
                        checkboxDisplay.value = 'none';
                    }
                }
            },
        );
        watch(
            () => visible.value,
            (val) => {
                if (val) {
                    const parentNode = props.getPopupContainer();
                    once(parentNode as HTMLElement, 'scroll', () => {
                        visible.value = false;
                    });
                }
            },
        );
        return {
            isUploading,
            isUploadError,
            checkboxDisplay,
            visible,
            uploadStatusText,
            loadStatus,
            _width,
            _height,

            handleRetryUpload,
            handleDelete,
            handleCheckedChange,
            handleCheckBoxMouseMove,
            handleCheckBoxMouseLeave,
            hide,
            handleLoad,
            handleError,
        };
    },
});
</script>
