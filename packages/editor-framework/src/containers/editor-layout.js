/**
 * EditorLayout
 */
import EditorLayoutTpl from './editor-layout.html';
import LayoutModel from '../base/layout-model';
import get from 'lodash/get';
import { resetElementsByMaskInfo } from '../static/mask-wrap/utils';

export default {
    name: 'editor-layout',
    template: EditorLayoutTpl,
    props: ['options', 'global', 'editor', 'layout'],
    data() {
        return {
            showMosaic: false,
        };
    },
    computed: {
        layoutModel() {
            if (this.layout instanceof LayoutModel) {
                return this.layout;
            }
            let layout = { ...this.layout };
            delete layout.elements;

            layout = new LayoutModel(layout);
            layout.elements = this.layout.elements;
            return layout;
        },
        layoutStyle() {
            const { layout, global } = this;
            return {
                height: Math.max(1, layout.height * global.zoom) + 'px',
                width: Math.max(1, layout.width * global.zoom) + 'px',
                transformOrigin: 'top left',
            };
        },

        isCurrentLayout() {
            return this.editor.currentLayout === this.layout;
        },

        supportImageTransformTypes() {
            return (
                this.curElem &&
                this.options.cropperOptions.imageTransformTypes.includes(this.curElem.type)
            );
        },
        curElem() {
            const editor = this.editor;
            return editor.currentSubElement || editor.currentElement;
        },
        backgroundMaskElements() {
            const elements = [];
            this.editor.walkTemplet(
                (el) => {
                    el.maskEnable && !el.hidden && elements.push(el);
                },
                true,
                [this.layout],
            );
            return elements;
        },
        watermarkEnable() {
            return (
                this.global.showWatermark ||
                !!get(this.global, 'layout.watermarkEnable') ||
                this.layout.watermarkEnable
            );
        },
        elements() {
            const elements = this.layout.elements || [];
            return resetElementsByMaskInfo(elements);
        },
    },
    methods: {
        setCurrentLayout(layout) {
            this.editor && this.editor.toggleLayout(layout);
        },
        isGroup(element) {
            return this.editor.isGroup(element);
        },
    },
    mounted() {
        this.showMosaic = false;
        setTimeout(() => {
            this.showMosaic = true;
        }, 2000);
    },
};
