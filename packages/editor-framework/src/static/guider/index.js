import utils from '../../utils/utils';
import lineGuider from './line-guider';
import marginGuider from './margin-guider';
import template from './template.html';

export default {
    name: 'guider',
    template,
    props: ['options', 'global', 'currentElement', 'currentSubElement', 'layout'],
    mixins: [marginGuider, lineGuider],
    data() {
        return {
            model: null,
        };
    },
    watch: {
        currentElement(v) {
            !v && this.clear();
        },
    },
    computed: {
        zoom() {
            return this.global.zoom;
        },
        editor() {
            return this.$parent;
        },
    },
    methods: {
        isText(rect) {
            return ['text', 'threeText', 'effectText'].includes(rect.type);
        },
        clear() {
            this.clearLineGuider();
            this.clearMarginGuider();
        },
        clearStyles() {
            this.clearLineStyles();
            this.clearMarginStyles();
        },
        getBBox(_rect) {
            const rect = utils.getBBox(_rect);
            rect.right = rect.left + rect.width;
            rect.bottom = rect.top + rect.height;
            rect.id = _rect.$id || Math.random();
            rect.type = _rect.type;
            return rect;
        },
        getOffset({ width, height }) {
            const offset = {};
            offset.x = width * this.zoom > 40 ? 4 : 3;
            offset.y = height * this.zoom > 40 ? 4 : 3;

            offset.x /= this.zoom;
            offset.y /= this.zoom;

            return offset;
        },
        dragMove() {
            const { show, marginShow } = this.model.$guider;
            const abs = (num) => Math.abs(num !== undefined ? num : Infinity);

            // 根据最小距离竞争吸附
            if (!show || !marginShow) return;
            const { xBestStates, yBestStates, distance: lineDistance } = this.getLineGuiderInfo();
            const { xBestState, yBestState, distance: marginDistance } = this.getMarginGuiderInfo();
            const lineInfo = {};
            const marginInfo = {};

            if (abs(lineDistance.x) < abs(marginDistance.x)) {
                lineInfo.yBestStates = yBestStates;
            } else {
                marginInfo.xBestState = xBestState;
            }

            if (abs(lineDistance.y) < abs(marginDistance.y)) {
                lineInfo.xBestStates = xBestStates;
            } else {
                marginInfo.yBestState = yBestState;
            }

            // 可能 marginGuider 吸附之后 modelBBox 被更新，
            // 此时计算线的位置就不够准确, 故需要在 checkMarginGuider 之后执行
            const setStylesLines = this.checkLineGuider(lineInfo);

            if (this.options.marginGuiderOptions.enable) {
                this.checkMarginGuider(marginInfo);
            }

            setStylesLines();
        },
    },
    events: {
        'element.dragStart'(model) {
            this.model = model;

            if (model.$customDragMove || this.currentSubElement === model) return;

            if (this.layout.elements.length > 80) {
                model.$guider.marginShow = false;
            }

            if (model.$guider.show) {
                this.bboxList = this.getLineBBoxList();
            }

            if (model.$guider.marginShow) {
                this.margin.bboxList = this.margin.bboxListCache = this.getMarginBBoxList();
                this.margin.xStatesCache = this.getMayMarginStates('x');
                this.margin.yStatesCache = this.getMayMarginStates('y');
            }
        },
        'element.dragMove'(drag, model) {
            if (model.$customDragMove || this.currentSubElement === model) return;

            const { show, marginShow } = model.$guider;
            if (show && !marginShow) {
                const lineInfo = this.getLineGuiderInfo();
                this.checkLineGuider(lineInfo)();
            } else if (!show && marginShow) {
                const marginInfo = this.getMarginGuiderInfo();
                this.checkMarginGuider(marginInfo);
            }

            this.dragMove();

            !show && this.clearLineStyles();
            !marginShow && this.clearMarginStyles();
        },
        'element.dragEnd'() {
            this.model = null;
            this.clear();
        },
    },
    beforeDestroy() {
        this.$emit('destroy');
    },
};
