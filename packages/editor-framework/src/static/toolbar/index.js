import $ from '@gaoding/editor-utils/zepto';
import { throttle, assign } from 'lodash';

import ToolbarMasker from './toolbar-masker';
import ToolbarWatermark from './toolbar-watermark';
import utils from '../../utils/utils';
import template from './toolbar.html';

export default {
    name: 'toolbar',
    props: ['options', 'global', 'currentLayout', 'model', 'subModel'],
    template,
    components: {
        ToolbarMasker,
        ToolbarWatermark,
    },
    data() {
        return {
            clickLocked: false,
            rect: {
                height: 0,
                width: 0,
                left: -99999, // 初始化移出可视区域, 防止会闪现
                top: -99999,
            },
            toolbarPosition: 'toolbar-north',
            config: {
                maskerFitPictureEnable: true,
            },
        };
    },
    computed: {
        editor() {
            return this.$parent;
        },
        type() {
            const { type } = this.model;
            if (['$masker', '$croper', '$background-croper'].includes(type)) return 'masker';
            if (['$watermarker'].includes(type)) return 'watermark';
            return null;
        },
        show() {
            const model = this.model;
            const global = this.global;

            if (!model || model.$draging || global.$draging) {
                this.rect.left = -99999; // 处理出现的时候闪动问题 chengguan 2016-10-13
                return false;
            }

            return true;
        },

        // 是否显示工具条
        isRenderToolbar() {
            if (['masker', 'croper', 'background-croper'].includes(this.type)) {
                return this.options.showEditConfirmToolbar;
            }

            return this.options.showToolbar;
        },

        isBackgroundCroper() {
            return this.model.type === '$background-croper';
        },
    },
    methods: {
        setConfig(data) {
            Object.assign(this.config, data);
        },
        // toolbar pop rect
        updateRect() {
            const global = this.global;
            const editor = this.editor;

            const model = this.model;
            const popShell = $(this.$el);

            if (!model || !popShell.length || !this.isRenderToolbar) {
                return;
            }

            const editorShellRect = editor.shellRect;
            const editorContainerRect = editor.containerRect;
            const popShellRect = popShell[0].getBoundingClientRect();

            // left, top
            const zoom = global.zoom;
            const bbox = utils.getBBoxByElement(model, zoom);
            let top = bbox.top - popShellRect.height + this.currentLayout.top * zoom;
            let left = bbox.left;

            // follow offset
            let followOffset = 12;

            // Return if not exist.
            if (!this.$refs.toolbar) {
                return false;
            }

            let topOffset, bottomOffset, transformRect;
            // 需要最小留白区域
            const neededSpace =
                (this.$refs.toolbar.neededSpace || 0) + popShellRect.height + followOffset;
            const canvasRect = editor.$el.getBoundingClientRect();

            const isBackgroundCroper = this.isBackgroundCroper;
            const isWatermarkEditor = this.type === 'watermark';

            if (isBackgroundCroper) {
                // 背景裁切工具条居中显示
                left = (this.currentLayout.width * zoom - popShellRect.width) / 2;
                transformRect = editor.$refs.backgroundEditor.getBoundingClientRect();
                topOffset = 0;
                bottomOffset = 0;
            } else if (isWatermarkEditor) {
                left = (this.currentLayout.width * zoom - popShellRect.width) / 2;
                transformRect = editor.$refs.watermarkEditor.$el.getBoundingClientRect();
                topOffset = 0;
                bottomOffset = 0;
            } else {
                transformRect = editor.$refs.transform.getBoundingClientRect();
                topOffset =
                    transformRect._transformEleRect.top - transformRect._rotatorHandleRect.top;
                bottomOffset =
                    transformRect._transformEleRect.bottom -
                    transformRect._rotatorHandleRect.bottom;
            }

            const topSpace = transformRect.top - canvasRect.top;
            const bottomSpace = canvasRect.bottom - transformRect.bottom;

            let relative = null; // Toolbar postion relative the element.
            if (topSpace > neededSpace || isBackgroundCroper || isWatermarkEditor) {
                relative = 'top';
                this.toolbarPosition = 'toolbar-north';
            } else if (bottomSpace > neededSpace) {
                relative = 'bottom';
                this.toolbarPosition = 'toolbar-south';
                top = bbox.top + bbox.height + this.currentLayout.top * zoom;
                followOffset = -12;
            } else if (bottomSpace > topSpace) {
                relative = 'bottom';
                this.toolbarPosition = 'toolbar-north';
                top = bbox.top + bbox.height + this.currentLayout.top * zoom;
                followOffset = -12;
            } else {
                relative = 'top';
                this.toolbarPosition = 'toolbar-south';
            }

            top -= followOffset;

            if (topOffset > 0 && relative === 'top') {
                top -= topOffset;
            } else if (bottomOffset < 0 && relative === 'bottom') {
                top -= bottomOffset;
            }

            let maxLeft = editorContainerRect.width - editorShellRect.left - popShellRect.width;
            let maxTop = editorContainerRect.height - editorShellRect.top - popShellRect.height;
            let minLeft = -editorShellRect.left;
            let minTop = -editorShellRect.top;

            // out offset for UI
            const positionOffset = 8;
            minLeft += positionOffset;
            minTop += positionOffset;
            maxLeft -= positionOffset;
            maxTop -= positionOffset;

            left = Math.max(minLeft, Math.min(maxLeft, left));
            top = Math.max(minTop, Math.min(maxTop, top));

            assign(this.rect, {
                height: popShellRect.height,
                width: popShellRect.width,
                left: left,
                top: top,
            });
        },

        autoUpdateRect() {
            const watcher = function () {
                if (!this.show) {
                    return;
                }
                this.updateRect();
            };

            this.$watch('global.zoom', watcher);
            this.$watch('subModel', watcher);
            this.$watch('model', watcher);
            this.$watch('show', watcher);

            this.updateRect();
        },

        // dom events
        onMousedown() {
            this.clickLocked = true;
        },
        onClick() {
            this.clickLocked = true;
        },
    },
    events: {
        'base.click'(e) {
            if (
                this.clickLocked &&
                // ignore editable element
                !utils.isEditable(e.target)
            ) {
                e.preventDefault();
            }
            this.clickLocked = false;

            return true;
        },
        'base.resize'() {
            this.lazyUpdateRect();

            return true;
        },
        'base.scroll'() {
            this.lazyUpdateRect();

            return true;
        },
        'background.editApply'() {
            this.clickLocked = false;
        },
        'element.editApply'() {
            this.clickLocked = false;
        },
    },
    created() {
        this.lazyUpdateRect = throttle(this.updateRect, 64, { leading: false });
    },
    mounted() {
        this.autoUpdateRect();
    },
};
