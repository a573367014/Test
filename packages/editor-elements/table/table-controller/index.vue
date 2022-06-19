<template>
    <div
        :id="`__table-controller-${model.$id}__`"
        :class="bem('', [editCell && 'editing', action, onlyContentEditable && 'style-disabled'])"
        :data-cursor="
            !onlyContentEditable ? 'cursor:' + cursor + ',rotate:' + cursorRotate : 'pointer'
        "
        tabindex="-1"
        ref="wrap"
        @mousedown="handleWrapMousedown"
        @keydown="handleWrapKeydown"
        @keyup.stop="handleWrapKeyUp"
        @contextmenu="handleContextMenu"
        @click="handleWrapClick"
        @dblclick.stop="() => {}"
    >
        <!-- 获取e.clipboardData复制外部表格 -->
        <input ref="pasteInput" :class="bem('paste-input')" @paste="handleInputPaste" />
        <div
            :id="`table-wrap-${model.$id}`"
            ref="tableWrap"
            :class="bem('table-wrap')"
            :style="tableWrapStyle"
        >
            <TableMain
                :zoom="zoom"
                :model="model"
                :editable="!!editCell"
                @change="handleChangeContent"
                @blur="handleTableBlur"
                @focus="handleTableFocus"
            />
        </div>
        <div data-cursor="pointer">
            <svg
                v-if="!resizing"
                :class="bem('all')"
                name="all-handle"
                @click="handleSelectAll($event)"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
            >
                <rect width="8" height="1.5" rx="0.75" fill="red" fill-opacity="0.96" />
                <rect y="3.25" width="8" height="1.5" rx="0.75" fill-opacity="0.96" />
                <rect y="6.5" width="8" height="1.5" rx="0.75" fill-opacity="0.96" />
            </svg>
        </div>
        <template v-if="canOpera">
            <Handle
                v-for="type in ['r', 'c']"
                :key="type"
                :class="prepareType === type ? bem('prepare-handle') : ''"
                :type="type === 'r' ? 'row' : 'col'"
                :tableInfo="tableInfo"
                :range="range"
                :model="model"
                :disableLine="isShiftMode || selecting || !!editCell"
                @drag="(e, index) => handleStripMousedown(e, index, type)"
                @add="(baseIndex, direction) => handleAddStrip(type, baseIndex, direction)"
                @mousedown="(e, order) => handleHandleMousedown(type, e, order)"
                @mouseup="handleHandleMouseup(type, $event)"
            />
        </template>
        <!-- 单元格控制面板 -->
        <div
            v-if="tableInfo"
            :class="bem('cell-controller')"
            :style="{ top: `${tableInfo.borderSizes[0]}px`, left: `${tableInfo.borderSizes[3]}px` }"
        >
            <template v-for="(row, rIdx) in tableInfo.cellRects">
                <div
                    v-for="(col, cIdx) in row"
                    :key="`${rIdx}-${cIdx}`"
                    :col="cIdx + 1"
                    :row="rIdx + 1"
                    :style="getCellHandlerStyle(col, rIdx, cIdx)"
                    @mousedown="handleCellMousedown"
                    @click="handleCellClick"
                />
            </template>
        </div>
        <!-- 选择框 -->
        <div
            ref="ranger"
            v-if="canOpera"
            :class="
                bem(
                    'ranger',
                    range && [
                        range.colspan === cells[0].length && 'row-full',
                        range.rowspan === cells.length && 'col-full',
                    ],
                )
            "
            :style="rangerStyle"
        >
            <div ref="vain" :class="bem('ranger__vain')" />
            <div :class="bem('ranger__border')" />
            <div
                :class="bem('ranger__cube')"
                data-cursor="crosshair"
                :style="{
                    display: !canCopy ? 'none' : '',
                    left: `calc(${rangerStyle.width} - 6px)`,
                    top: `calc(${rangerStyle.height} - 6px)`,
                }"
                @mousedown.stop.prevent="handleCopyContent"
            />
        </div>
        <div
            :class="bem('del-strip-btn')"
            data-cursor="pointer"
            @click="onDeleteStrip()"
            :style="delBtnStyle"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M6.20666 1.6665C6.0804 1.6665 5.96498 1.73784 5.90852 1.85077L5.33398 2.99984H2.33398V4.33317H3.37436L4.00213 13.7108C4.02547 14.061 4.31634 14.3332 4.66732 14.3332H11.334C11.685 14.3332 11.9758 14.061 11.9992 13.7108L12.6269 4.33317H13.6673V2.99984H10.6673L10.0928 1.85077C10.0363 1.73784 9.9209 1.6665 9.79464 1.6665H6.20666ZM4.71265 4.33317H11.288L10.71 12.9998H5.29065L4.71265 4.33317Z"
                />
            </svg>
        </div>
        <TableTransform
            v-if="canOpera"
            ref="transform"
            :model="model"
            :editor="editor"
            :onGripChange="handleGripChange"
            @mouseenter="handleTransformMouseenter"
            @mouseleave="handleTransformMouseleave"
        />
        <div :class="bem('menu-wrap')" ref="menuWrap" :style="{ transform: transformInvert() }">
            <UiContextmenu
                ref="menu"
                :menuData="menuData"
                :show.sync="menu.show"
                :x="menu.x"
                :y="menu.y"
            />
        </div>
    </div>
</template>
<script>
import bemMixin from './bem.mixin';
import TableMain from './component/main.vue';
import { cloneDeep, get } from 'lodash';
import TableTransform from './component/transform.vue';
import utils from '@gaoding/editor-framework/src/utils/utils';
import Handle from './component/handle.vue';
import UiContextmenu from '@gaoding/editor-framework/src/static/contextmenu/ui-contextmenu';
import menuMixin from './menu.mixin';
import {
    clearCells,
    findSuitRange,
    getTableBorderSizes,
    resizeTable,
    setTableSizeRule,
    getTrDoms,
    getColDoms,
    findSpanCellRange,
    getTableViewportWidth,
    shotTableElement,
    createStrips,
    deleteStrips,
    canMergeCells,
    getColOffsetWidth,
} from '../utils';
import { getMetaKey, transformInvert } from './utils';
import {
    parseTableHtml,
    padCells,
    conformTableClipboard,
    copyPartialTable,
    getOuterTableClipboard,
} from '../paste';

export default {
    name: 'table-controller',
    components: {
        TableMain,
        TableTransform,
        Handle,
        UiContextmenu,
    },
    mixins: [bemMixin, menuMixin],
    props: {
        editor: {
            type: Object,
            default: () => {},
        },
        model: {
            type: Object,
            default: () => {},
        },
        onlyContentEditable: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            tableInfo: null,
            rotating: false,
            selecting: false,
            resizing: false,
            menu: {
                show: false,
                x: 0,
                y: 0,
            },
            menuData: [],
            action: '',
            editCell: null,
            beginOrder: null, // 多选行列起始值
            resizingZoom: 1,
            prepareType: '',
            cacheInputContent: '',
            rangerStyle: {},
        };
    },
    computed: {
        zoom() {
            return this.editor.zoom;
        },
        tableData() {
            return this.model && this.model.tableData;
        },
        cells() {
            return this.model.$cells;
        },
        range() {
            return this.model.$currentRange;
        },
        tableBorderSizes() {
            return getTableBorderSizes(this.model);
        },
        delBtnStyle() {
            const { rangerStyle, range, tableInfo } = this;
            if (!tableInfo || !range) return {};
            const { cellRects } = tableInfo;
            const isFullRow = range.colspan === cellRects[0].length;
            const isFullCol = range.rowspan === cellRects.length;
            const style = { display: 'flex' };
            if (isFullCol) {
                style.top = '-40px';
                style.left =
                    parseFloat(rangerStyle.left) + parseFloat(rangerStyle.width) / 2 - 12 + 'px';
            } else if (isFullRow) {
                style.left = '-40px';
                style.top =
                    parseFloat(rangerStyle.top) + parseFloat(rangerStyle.height) / 2 - 12 + 'px';
            } else {
                style.display = '';
            }
            return style;
        },
        canCopy() {
            const { range, cells } = this;
            if (!range) return false;
            // 含有合并单元格
            for (let i = range.row; i < range.row + range.rowspan; i++) {
                for (let j = range.col; j < range.col + range.colspan; j++) {
                    const cell = cells[i - 1][j - 1];
                    if (!cell || cell.rowspan > 1 || cell.colspan > 1) return false;
                }
            }
            // 全选
            return cells[0].length !== range.colspan && cells.length !== range.rowspan;
        },
        tableWrapStyle() {
            const { model, editor, resizingZoom } = this;
            const { width, height, opacity } = model;
            const zoom = editor.zoom * resizingZoom;
            return {
                width: width + 'px',
                height: height + 'px',
                opacity,
                transformOrigin: '0 0',
                transform: `scale(${zoom})`,
            };
        },
        isShiftMode() {
            return this.action === 'shift';
        },
        canOpera() {
            return this.tableInfo && !this.resizing;
        },
        cursor() {
            const { resizing, editCell, action, range } = this;
            if (editCell) return 'text';
            if (resizing) return 'ewResize';
            if (action === 'copy') return 'crosshair';
            if (range) return 'default';
            return 'move';
        },
        cursorRotate() {
            const { resizing, model } = this;
            switch (resizing) {
                case 'c':
                    return -model.rotate;
                case 'r':
                    return -model.rotate + 90;
                case 'e':
                    return -model.rotate;
                case 's':
                    return -model.rotate + 90;
                default:
                    return 0;
            }
        },
    },
    watch: {
        range() {
            // 清空文本选中
            if (document) {
                const selection = document.getSelection();
                selection.removeAllRanges();
            }
            this.updateRangerStyle();
            this.$refs.wrap && this.$refs.wrap.focus();
            this.editCell = null;
        },
        model: {
            immediate: true,
            handler(newModel, oldModel) {
                if (get(newModel, '$id') !== get(oldModel, '$id')) {
                    this.$nextTick(() => {
                        oldModel && (oldModel.$editing = false);
                        this.init();
                    });
                }
            },
        },
        'editor.zoom'() {
            this.collectTableInfo();
            this.updateRangerStyle();
        },
        'model.width'() {
            this.collectTableInfo();
        },
        'model.height'() {
            this.collectTableInfo();
            this.updateRangerStyle();
        },
        'model.tableData'() {
            this.collectTableInfo();
        },
        isShiftMode(mode) {
            const { range, tableData } = this;
            if (mode && range) {
                if (range.colspan === tableData.cells[0].length) {
                    this.beginOrder = this.range.row;
                } else if (range.rowspan === tableData.cells.length) {
                    this.beginOrder = this.range.col;
                }
            }
        },
        resizing(resizing) {
            resizing && this.changeRange(null);
            // 显示尺寸值
            if (!resizing && this.$tip) {
                this.$tip.style.display = 'none';
            }
        },
    },
    beforeDestroy() {
        this._inputSizeObserver && this._inputSizeObserver.disconnect();
        this.changeRange(null);
        this.$tip && document.body.removeChild(this.$tip);
        this.model.$editing = false;
        this.clearMergeEvent();
    },
    methods: {
        init() {
            this.model.$editing = true;
            this._tableDom && (this._tableDom = null);
            this._inputSizeObserver && this._inputSizeObserver.disconnect();
            this.tableInfo = null;
            this.changeRange(null);
            this.$refs.wrap.focus();
            this._fixedTableSize();
            this.collectTableInfo();

            this.clearMergeEvent();
            this.initMergeEvent();
        },
        // 固定表格尺寸
        _fixedTableSize() {
            const $table = this.getTableDom();
            const heights = getTrDoms($table).map(($tr) => $tr.offsetHeight);
            const widths = getColDoms($table).map(($col) => getColOffsetWidth($col));
            setTableSizeRule(this.tableData, { cols: widths, rows: heights });
            /**
             * 表格的width|height值通过计算无法得到实际$table dom 尺寸，
             * 聚焦时利用cache方式设置model值
             */
            this.$nextTick(() => {
                Object.assign(this.model, {
                    width: $table.offsetWidth,
                    height: $table.offsetHeight,
                });
            });
        },
        _observeInput() {
            this._disObserveInput();
            // 监听表格尺寸变化，响应更新model尺寸数据
            const tableDom = this.getTableDom();
            this._inputSizeObserver = new ResizeObserver(() => {
                if (!this.$refs.wrap) return;
                const { model } = this;
                const height = tableDom.offsetHeight;
                if (height === model.height) return;
                // 重新计算行列宽高，自动尺寸变化不加入history
                Object.assign(model, {
                    ...this._calTablePos(),
                    height,
                });
            });
            this._inputSizeObserver.observe(tableDom);
        },
        _disObserveInput() {
            if (this._inputSizeObserver) {
                this._inputSizeObserver.disconnect();
            }
        },
        // 计算位置偏移
        _calTablePos() {
            const { model } = this;
            const $table = this.getTableDom();
            const { offsetWidth: width, offsetHeight: height } = $table;
            const sin = Math.sin(utils.degToRad(model.rotate));
            const cos = Math.cos(utils.degToRad(model.rotate));
            // 节流更新元素尺寸
            const dx = width - model.width;
            const dy = height - model.height;
            const p1 = {
                x: model.left + model.width / 2,
                y: model.top + model.height / 2,
            };
            const p2 = {
                x: p1.x + (dx / 2) * cos - (dy / 2) * sin,
                y: p1.y + (dx / 2) * sin + (dy / 2) * cos,
            };
            return {
                left: p2.x - width / 2,
                top: p2.y - height / 2,
            };
        },
        _captureTableWidth(model = this.model) {
            return getTableViewportWidth(model);
        },
        _captureTableSize(model = this.model) {
            return {
                width: this._captureTableWidth(model),
                height: this.getTableDom().offsetHeight,
            };
        },
        _shotTable(props = {}) {
            shotTableElement(this.model, this.editor, { props });

            if (this.$refs.wrap) {
                this.$refs.wrap.style.width = '';
                this.$refs.wrap.style.height = '';
            }
        },
        changeRange(range) {
            const { model } = this;
            model.$currentRange = range;
        },
        transformInvert() {
            return transformInvert(this.model);
        },
        getTableDom() {
            if (this._tableDom) return this._tableDom;
            const dom = this.$refs.wrap.querySelector('table');
            this._tableDom = dom;
            return dom;
        },
        // 收集表格DOM信息
        collectTableInfo() {
            this.$nextTick(() => {
                const { zoom } = this;
                const $table = this.getTableDom();
                const $tbody = $table.querySelector('tbody');
                const $colgroup = $table.querySelector('colgroup');
                const { offsetLeft: bodyLeft } = $tbody;
                const borderSizes = this.tableBorderSizes;
                const rowRects = [];
                const colRects = [];
                const cellRects = [];
                $tbody.querySelectorAll('tbody>tr').forEach((tr) => {
                    rowRects.push({
                        height: tr.offsetHeight * zoom,
                        top: (borderSizes[0] + tr.offsetTop) * zoom,
                    });
                    const rects = [];
                    tr.childNodes.forEach((td) => {
                        const rect = {
                            width: 0,
                            height: 0,
                            left: 0,
                            top: 0,
                            contentWidth: 0,
                            contentHeight: 0,
                            clientLeft: 0,
                            clientTop: 0,
                        };
                        td.nodeType === 1 &&
                            Object.assign(rect, {
                                width: td.offsetWidth * zoom,
                                height: td.offsetHeight * zoom,
                                contentWidth: td.clientWidth * zoom,
                                contentHeight: td.clientHeight * zoom,
                                left: (td.offsetLeft - bodyLeft) * zoom,
                                top: td.offsetTop * zoom,
                                clientLeft: td.clientLeft * zoom,
                                clientTop: td.clientTop * zoom,
                                rowspan: Number(td.getAttribute('rowspan')) || 1,
                                colspan: Number(td.getAttribute('colspan')) || 1,
                            });
                        rects.push(rect);
                    });
                    cellRects.push(rects);
                });

                // 收集列尺寸
                let stackLeft = borderSizes[3] * zoom;
                const tdInfos = [];
                $tbody.querySelectorAll('tbody>tr:first-child td').forEach(($td) => {
                    const info = { left: $td.offsetLeft * zoom };
                    tdInfos.push(info);
                    let colspan = Number($td.getAttribute('colspan'));
                    if (colspan > 1) {
                        while (--colspan) {
                            tdInfos.push(null);
                        }
                    }
                });
                $colgroup.querySelectorAll('col').forEach((col, cIdx) => {
                    const info = tdInfos[cIdx] || { left: stackLeft };
                    info.width = getColOffsetWidth(col) * zoom;
                    colRects.push(info);
                    stackLeft += info.width;
                });

                this.tableInfo = {
                    size: {
                        width: $table.offsetWidth * zoom,
                        height: $table.offsetHeight * zoom,
                    },
                    borderSizes: borderSizes.map((s) => s * zoom),
                    rowRects,
                    colRects,
                    cellRects,
                };
            });
        },
        updateRangerStyle() {
            const { range, cells, zoom, tableBorderSizes } = this;
            if (!this.$refs.wrap || !range) {
                this.rangerStyle = {};
                return;
            }
            const $table = this.getTableDom();
            const $tbody = $table.querySelector('tbody');
            let style = {
                left: 0,
                top: 0,
                width: 0,
                height: 0,
            };
            const isFullRow = range.colspan === cells[0].length;
            const isFullCol = range.rowspan === cells.length;
            if (isFullRow) {
                const $start = $table.querySelector(`tbody>tr[row='${range.row}']`);
                let $end = $start;
                if (range.rowspan) {
                    $end = $table.querySelector(`tbody>tr[row='${range.row + range.rowspan - 1}']`);
                }
                style = {
                    left: 0,
                    top: range.row === 1 ? 0 : $start.offsetTop + tableBorderSizes[0],
                    width: $tbody.offsetWidth + tableBorderSizes[3] + tableBorderSizes[1],
                    height: isFullCol
                        ? $table.offsetHeight
                        : range.row + range.rowspan - 1 === cells.length
                        ? $table.offsetHeight - $start.offsetTop - tableBorderSizes[0]
                        : $end.offsetTop -
                          (range.row === 1 ? -tableBorderSizes[0] : $start.offsetTop) +
                          $end.offsetHeight,
                };
            } else if (isFullCol) {
                const $colList = getColDoms($table);
                const left = $colList
                    .slice(0, range.col - 1)
                    .reduce((width, $col) => width + getColOffsetWidth($col), 0);
                const width = $colList
                    .slice(range.col - 1, range.col + range.colspan - 1)
                    .reduce((width, $col) => width + getColOffsetWidth($col), 0);
                style = {
                    left: range.col === 1 ? 0 : left + tableBorderSizes[3],
                    top: 0,
                    width:
                        width +
                        (range.col === 1 ? tableBorderSizes[3] : 0) +
                        (range.col + range.colspan - 1 === cells[0].length
                            ? tableBorderSizes[1]
                            : 0),
                    height: $table.offsetHeight,
                };
            } else {
                const $start = $table.querySelector(
                    `tbody>tr>td[row='${range.row}'][col='${range.col}']`,
                );
                let $end = $start;
                const endRow = range.row + range.rowspan - 1;
                const endCol = range.col + range.colspan - 1;
                const endCell = cells[endRow - 1][endCol - 1];
                if (endCell) {
                    $end = $table.querySelector(`tbody>tr>td[row='${endRow}'][col='${endCol}']`);
                } else {
                    const spanRange = findSpanCellRange(cells, endRow - 1, endCol - 1);
                    $end = $table.querySelector(
                        `tbody>tr>td[row='${spanRange.row}'][col='${spanRange.col}']`,
                    );
                }
                style = {
                    left: $start.offsetLeft,
                    top: $start.offsetTop,
                    width: $end.offsetLeft - $start.offsetLeft + $end.offsetWidth,
                    height: $end.offsetTop - $start.offsetTop + $end.offsetHeight,
                };
            }
            Object.keys(style).forEach((key) => {
                style[key] = style[key] * zoom + 'px';
            });
            this.rangerStyle = { display: 'block', ...style };
        },
        /**
         * type 行（列）
         */
        handleStripMousedown(e, index, type = 'c') {
            this.model.$editing = true;
            this.resizing = type;
            let hadMove = false;
            const begin = this.getResizeStripBeginState(e, index, type);
            const { startLen, tableSize, strip: $strip } = begin;
            let tableMinInfo;
            if (type === 'c') {
                tableMinInfo = this._getTableColsMinWidths();
            }
            const onMove = (e) => {
                if (this.resizing !== type) return;
                hadMove = true;
                e.preventDefault();
                e.stopPropagation();
                const offset = this.calResizeOffset(begin, { x: e.screenX, y: e.screenY });
                if (type === 'r') {
                    const height = startLen + offset.y;
                    this.$refs.tableWrap.style.height = tableSize.height + offset.y + 'px';
                    $strip.style.height = height + 'px';
                    this.onShowTip(e, parseInt($strip.offsetHeight));
                } else {
                    const width = Math.max(startLen + offset.x, tableMinInfo.minWidths[index]);
                    $strip.style.width = width + 'px';
                    this.$refs.tableWrap.style.width = tableSize.width + offset.x + 'px';
                    this.onShowTip(e, parseInt($strip.offsetWidth));
                }
                this.collectTableInfo();
            };
            const onUp = () => {
                e.preventDefault();
                e.stopPropagation();
                this.resizing = null;
                if (hadMove) {
                    this._shotTable();
                    this.collectTableInfo();
                }
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        handleGripChange(grip, e) {
            this.model.$editing = true;
            this.resizing = grip;
            this.prepareType = '';
            const begin = this.getResizeBeginState(e);
            const { tableSize } = begin;
            const [colBeginWidths, trBeginHeights, colDoms, trDoms] = this.getStripsSizes();
            const tableMinInfo = {};
            if (grip === 'se' || grip === 'e') {
                Object.assign(tableMinInfo, this._getTableColsMinWidths());
            }
            const onMove = (e) => {
                if (!this.resizing) return;
                e.preventDefault();
                e.stopPropagation();
                const offset = this.calResizeOffset(begin, { x: e.screenX, y: e.screenY });
                if (grip === 'e') {
                    const offsetX = this.$refs.tableWrap.offsetWidth - tableSize.width;
                    colDoms.forEach(($col, i) => {
                        const width = colBeginWidths[i];
                        const colWidth = Math.max(
                            width + offsetX * (width / tableSize.width),
                            tableMinInfo.minWidths[i],
                        );
                        $col.style.width = colWidth + 'px';
                    });
                    this.$refs.tableWrap.style.width = tableSize.width + offset.x + 'px';
                }
                if (grip === 's') {
                    this.$refs.tableWrap.style.height = tableSize.height + offset.y + 'px';
                    const offsetY = this.$refs.tableWrap.offsetHeight - tableSize.height;
                    trDoms.forEach(($tr, i) => {
                        const height = trBeginHeights[i];
                        const trHeight = height + offsetY * (height / tableSize.height);
                        $tr.style.height = trHeight + 'px';
                    });
                }
                // 等比缩放字体、边距、边框
                if (grip === 'se') {
                    const newWidth = Math.max(
                        tableSize.width + offset.x,
                        tableMinInfo.tableMinWidth,
                    );
                    const minSize = Math.min(...[...trBeginHeights, ...colBeginWidths]);
                    const minRatio = Math.min(20 / minSize, 1);
                    const ratio = newWidth / tableSize.width;
                    this.resizingZoom = Math.max(ratio, minRatio);
                }
                const { offsetWidth, offsetHeight } = this.getTableDom();
                this.onShowTip(
                    e,
                    `${Math.round(offsetWidth * this.resizingZoom)} x ${Math.round(
                        offsetHeight * this.resizingZoom,
                    )}`,
                );
            };
            const onUp = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.resizing = false;
                if (grip === 'se') {
                    resizeTable(this.model, this.resizingZoom);
                    const width = this.model.width * this.resizingZoom;
                    const height = this.model.height * this.resizingZoom;

                    // 计算坐标旋转偏移
                    const { model } = this;
                    const points = utils.getRectPoints(model);
                    const newPoints = utils.getRectPoints({
                        left: model.left,
                        top: model.top,
                        width: width,
                        height: height,
                        rotate: model.rotate,
                        skewX: model.skewX,
                        skewY: model.skewY,
                    });
                    const prePoint = points.nw;
                    const newPoint = newPoints.nw;
                    const left = model.left - (newPoint.x - prePoint.x);
                    const top = model.top - (newPoint.y - prePoint.y);
                    this._shotTable({ width, height, left, top });
                    this.resizingZoom = 1;
                } else {
                    this._shotTable();
                }

                this.collectTableInfo();
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        /**
         * 计算resize偏移
         * @param {Object} beginState 初始状态
         * @param {*} point
         * @returns
         */
        calResizeOffset(beginState, point) {
            const { sx, sy, sin, cos, zoom } = beginState;
            const offset = { x: point.x - sx, y: point.y - sy };
            if (offset.x === 0 && offset.y === 0) {
                return offset;
            }
            const d = Math.sqrt(Math.pow(offset.x, 2) + Math.pow(offset.y, 2));
            return {
                x: (d * ((sin * offset.y) / d + (cos * offset.x) / d)) / zoom,
                y: (d * ((cos * offset.y) / d - (sin * offset.x) / d)) / zoom,
            };
        },
        /**
         * 获取resize初始状态数据
         * @param {MouseEvent} e
         * @returns
         */
        getResizeBeginState(e) {
            const { editor, model } = this;
            const tableDom = this.getTableDom();
            const tableSize = { width: tableDom.offsetWidth, height: tableDom.offsetHeight };
            return {
                zoom: editor.zoom,
                sx: e.screenX,
                sy: e.screenY,
                tableSize,
                cos: Math.cos((model.rotate / 180) * Math.PI),
                sin: Math.sin((model.rotate / 180) * Math.PI),
            };
        },
        /**
         * 获取开始resize行列状态数据
         */
        getResizeStripBeginState(e, index, type = 'c') {
            const $table = this.getTableDom();
            const strips = type === 'r' ? getTrDoms($table) : getColDoms($table);
            const strip = strips[index];
            return {
                ...this.getResizeBeginState(e),
                order: index + 1,
                strip,
                startLen: type === 'r' ? strip.offsetHeight : getColOffsetWidth(strip),
            };
        },
        cloneCells() {
            return this.tableData.cells.map((row) => row.map((col) => col && { ...col }));
        },
        handleChangeContent({ v }) {
            this.cacheInputContent = v;
        },
        handleCellMousedown() {
            this.onHideMenu();
            const { top, left } = this.model;
            // 记录是否位移
            this._startPosition = {
                left,
                top,
                row: get(this.range, 'row'),
                col: get(this.range, 'col'),
            };
        },
        handleCellClick(downEvent) {
            downEvent.stopPropagation();
            const startRow = Number(downEvent.target.getAttribute('row'));
            const startCol = Number(downEvent.target.getAttribute('col'));
            if (this.isShiftMode && this.range) {
                // 多选模式
                this.changeRange(
                    findSuitRange(this.tableData.cells, this.range, {
                        row: startRow,
                        col: startCol,
                    }),
                );
            } else {
                const { top, left } = this.model;
                if (this._startPosition.top === top && this._startPosition.left === left) {
                    // 点击单元格为选中单元格则进入编辑
                    if (
                        this._startPosition.row === startRow &&
                        this._startPosition.col === startCol
                    ) {
                        this.onEdit();
                    } else {
                        // 未移动则选中单元格
                        const cell = this.tableData.cells[startRow - 1][startCol - 1];
                        this.changeRange({
                            row: startRow,
                            col: startCol,
                            rowspan: cell.rowspan || 1,
                            colspan: cell.colspan || 1,
                        });
                    }
                }
            }
        },
        handleWrapMousedown(downEvent) {
            if (downEvent.button !== 0) return;
            this.selecting = true;
            const startRow = Number(downEvent.target.getAttribute('row'));
            const startCol = Number(downEvent.target.getAttribute('col'));
            const moving = !this.range;
            if (!moving) {
                downEvent.stopPropagation();
                downEvent.preventDefault();
            }
            const onMouseMove = (moveEvent) => {
                if (!this.selecting || moving) return;
                const endRow = Number(moveEvent.target.getAttribute('row'));
                const endCol = Number(moveEvent.target.getAttribute('col'));
                if (!startRow || !startCol || !endRow || !endCol) return;
                if (this.isShiftMode) return;
                this.changeRange(
                    findSuitRange(
                        this.cells,
                        { row: startRow, col: startCol },
                        { row: endRow, col: endCol },
                    ),
                );
                this.$refs.wrap.focus();
            };
            const onMouseup = (e) => {
                this.selecting = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseup);
                if (moving) {
                    this._onDragEnd(e);
                }
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseup);
        },
        // 表格移动结束
        _onDragEnd() {
            const { editor } = this;
            editor.$refs.transform.toggleDragLocked(false);
        },
        handleWrapKeydown(e) {
            if (this.range) {
                // 如果选中单元格，则禁止全局键盘
                e.stopPropagation();
            }
            if (e.shiftKey) {
                this.action = 'shift';
            } else if (getMetaKey(e)) {
                this.action = 'meta';
                if (this.range) {
                    this.$refs.pasteInput.focus();
                }
            }
            switch (e.key) {
                case 'Backspace':
                    this.onClearContent();
                    break;
                case 'Escape':
                    this.changeRange(null);
                    break;
                case 'a':
                    if (this.action === 'meta') {
                        e.preventDefault();
                        this.handleSelectAll();
                        this.acting = 'all';
                    }
                    break;
                case 'c':
                    if (this.action === 'meta') {
                        if (this.range) {
                            e.preventDefault();
                            if (this.acting !== 'copy') {
                                this.copyCellContent();
                                this.acting = 'copy';
                            }
                        }
                    } else {
                        this.$nextTick(() => {
                            this.onEdit();
                        });
                    }
                    break;
                case 'v':
                    if (this.action !== 'meta') {
                        this.$nextTick(() => {
                            this.onEdit();
                        });
                    }
                    break;
                case 'z':
                    if (this.action === 'meta') {
                        e.preventDefault();
                        this.editor.undo();
                    }
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.onCancelEdit();
                    this.moveRange('ArrowRight');
                    this.$nextTick(() => {
                        this.onEdit();
                    });
                    break;
                case 'Enter':
                    break;
                default: {
                    if (!this.action) {
                        this.$nextTick(() => {
                            this.onEdit();
                        });
                    }
                }
            }
            if (e.key.includes('Arrow')) this.moveRange(e.key);
        },
        handleWrapKeyUp(e) {
            e.stopPropagation();
            e.preventDefault();
            this.clearKeyboardAction(e);
            switch (e.key) {
                case 'Enter':
                    if (document.activeElement === this.$refs.wrap) {
                        this.onEdit();
                    }
                    break;
                case 'Escape':
                    this.onCancelEdit();
                    break;
            }
        },
        onEdit() {
            if (!this.range) return;
            const { row, col, rowspan, colspan } = this.range;

            // 多选不可输入
            const curCell = this.cells[row - 1][col - 1];
            if (
                !curCell ||
                ((rowspan > 1 || colspan > 1) &&
                    (curCell.rowspan !== rowspan || curCell.colspan !== colspan))
            )
                return;

            const $cell = this.getTableDom().querySelector(
                `table>tbody>tr>td[row="${row}"][col="${col}"]>div`,
            );
            if (!$cell) return;
            this.editCell = { row, col };
            const range = document.createRange();
            range.selectNode($cell);
            const selection = document.getSelection();
            range.setStart($cell, 0);
            range.setEnd($cell, $cell.childNodes.length);
            selection.removeAllRanges();
            selection.addRange(range);
            this.cacheInputContent = $cell.innerText;
            this._observeInput();
            this.$nextTick(() => {
                $cell.focus();
            });
        },
        onCancelEdit() {
            document.activeElement && document.activeElement.blur();
            document.getSelection().removeAllRanges();
            this.$refs.wrap.focus();
        },
        moveRange(key) {
            if (!this.range) return;
            const rlen = this.tableData.cells.length;
            const clen = this.tableData.cells[0].length;
            const { row, col, rowspan, colspan } = this.range;
            switch (key) {
                case 'ArrowUp':
                    this.changeRange({
                        ...this.range,
                        row: row > 1 ? row - 1 : rlen - rowspan + 1,
                    });
                    break;
                case 'ArrowDown':
                    this.changeRange({
                        ...this.range,
                        row: row + rowspan - 1 < rlen ? row + 1 : 1,
                    });
                    break;
                case 'ArrowLeft':
                    this.changeRange({
                        ...this.range,
                        col: col > 1 ? col - 1 : clen - colspan + 1,
                    });
                    break;
                case 'ArrowRight':
                    this.changeRange({
                        ...this.range,
                        col: col + colspan - 1 < clen ? col + 1 : 1,
                    });
                    break;
            }
        },
        onClearContent() {
            const { range, model } = this;
            if (range) {
                clearCells(model, range);
                this._shotTable();
            }
        },
        handleCopyContent() {
            const { range, tableInfo } = this;
            const { rowRects, colRects } = tableInfo;
            this.action = 'copy';
            let extendRow = 0;
            let extendCol = 0;
            const onMouseMove = (moveEvent) => {
                if (this.action !== 'copy') return;
                const endRow = Number(moveEvent.target.getAttribute('row'));
                const endCol = Number(moveEvent.target.getAttribute('col'));
                if (!endRow && !endCol) return;
                extendRow = 0;
                extendCol = 0;
                const direct = endRow - range.row >= endCol - range.col; // true为垂直方向
                direct ? (extendRow = endRow) : (extendCol = endCol);
                // 辅助框
                const rangeColOverIndex = range.col + range.colspan - 2;
                const rangeRowOverIndex = range.row + range.rowspan - 2;
                const height = direct
                    ? rowRects[endRow - 1].top +
                      rowRects[endRow - 1].height -
                      rowRects[range.row - 1].top
                    : rowRects[rangeRowOverIndex].top +
                      rowRects[rangeRowOverIndex].height -
                      rowRects[range.row - 1].top;
                const width = direct
                    ? colRects[rangeColOverIndex].left +
                      colRects[rangeColOverIndex].width -
                      colRects[range.col - 1].left
                    : colRects[endCol - 1].left +
                      colRects[endCol - 1].width -
                      colRects[range.col - 1].left;
                this.$refs.vain.style.height = height + 'px';
                this.$refs.vain.style.width = width + 'px';
            };
            const onMouseup = () => {
                this.action = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseup);
                this.$refs.vain.style.height = 0;
                this.$refs.vain.style.width = 0;
                const cells = this.cells;
                if (!extendRow && !extendCol) return;
                if (extendRow) {
                    for (let i = range.row; i <= extendRow; i++) {
                        for (let j = 0; j < range.colspan; j++) {
                            const row = (i - 1) % range.rowspan;
                            const col = range.col + j - 1;
                            cells[i - 1][col].content = cells[range.row + row - 1][col].content;
                        }
                    }
                    this.changeRange({ ...range, rowspan: extendRow - range.row + 1 });
                } else if (extendCol) {
                    for (let i = range.col; i <= extendCol; i++) {
                        for (let j = 0; j < range.rowspan; j++) {
                            const col = (i - 1) % range.colspan;
                            const row = range.row + j - 1;
                            cells[row][i - 1].content = cells[row][range.col + col - 1].content;
                        }
                    }
                    this.changeRange({ ...range, colspan: extendCol - range.col + 1 });
                }
                this._shotTable();
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseup);
        },
        handleHandleMousedown(type, e, order) {
            if (this.range && this.range.col === order) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (!this.beginOrder) {
                this.beginOrder = Number(e.target.getAttribute('order'));
            }

            let moving = this.beginOrder;

            const onMove = (moveEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                const curOrder = Number(moveEvent.target.getAttribute('order'));
                if (!moving) return;
                curOrder && this.onStripSelect(type, curOrder);
            };

            const onUp = () => {
                moving = null;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        handleHandleMouseup(type, e) {
            const order = Number(e.target.getAttribute('order'));
            this.onStripSelect(type, order);
            if (!this.isShiftMode) {
                this.beginOrder = null;
            }
        },
        onStripSelect(type, order) {
            const { beginOrder, tableInfo } = this;
            const { rowRects, colRects } = tableInfo;
            const orders = order > beginOrder ? [beginOrder, order] : [order, beginOrder];
            // 支持合并单行选中
            if (type === 'r') {
                this.changeRange({
                    row: orders[0],
                    col: 1,
                    rowspan: orders[1] - orders[0] + 1,
                    colspan: colRects.length,
                });
            } else if (type === 'c') {
                this.changeRange({
                    row: 1,
                    col: orders[0],
                    rowspan: rowRects.length,
                    colspan: orders[1] - orders[0] + 1,
                });
            }
        },
        handleSelectAll() {
            const { rowRects, colRects } = this.tableInfo;
            const range = { row: 1, col: 1, rowspan: rowRects.length, colspan: colRects.length };
            this.changeRange(range);
        },
        handleAddStrip(type, baseIndex, direction) {
            createStrips(this.model, this.editor, type, { baseIndex, direction });
            this.changeRange(null);
        },
        onDeleteStrip(range) {
            range = range || this.range;
            if (range.rowspan === this.cells.length && range.colspan === this.cells[0].length) {
                this.editor.removeElement(this.model);
                return;
            }
            deleteStrips(this.model, this.editor, range);
        },
        handleContextMenu(e) {
            if (!this.range) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = this.$refs.menuWrap.getBoundingClientRect();
            this.menuData = this.getMenuData(e);
            this.menu = {
                show: true,
                x: e.clientX - rect.x,
                y: e.clientY - rect.y,
            };
        },
        // 获取表格DOM行列尺寸
        getStripsSizes(excludeRange) {
            const trDoms = getTrDoms(this.getTableDom());
            const colDoms = getColDoms(this.getTableDom());
            const trBeginHeights = [];
            const colBeginWidths = [];

            const exCols = [];
            const exRows = [];
            if (excludeRange) {
                if (excludeRange.rowspan >= this.tableData.cells.length) {
                    while (exCols.length < excludeRange.colspan) {
                        exCols.push(excludeRange.col + exCols.length);
                    }
                } else {
                    while (exRows.length < excludeRange.rowspan) {
                        exRows.push(excludeRange.row + exRows.length);
                    }
                }
            }
            trDoms.forEach(
                (tr, i) => !exRows.includes(i + 1) && trBeginHeights.push(tr.offsetHeight),
            );
            colDoms.forEach(
                (col, i) => !exCols.includes(i + 1) && colBeginWidths.push(getColOffsetWidth(col)),
            );
            return [colBeginWidths, trBeginHeights, colDoms, trDoms];
        },
        handleTableBlur(e, cell) {
            const cells = this.cells;
            if (cells[cell.r][cell.c].content === this.cacheInputContent) return;
            cells[cell.r][cell.c].content = this.cacheInputContent;
            this._shotTable({ fixed: false });
            this.cacheInputContent = '';
            this._disObserveInput();
            this.editCell = null;
        },
        handleTableFocus() {},
        onShowTip(e, content = '') {
            const id = '__editor-controller-tip__';
            this.$tip = document.getElementById(id);
            if (!this.$tip) {
                this.$tip = document.createElement('div');
                this.$tip.id = id;
                document.body.appendChild(this.$tip);
            }
            this.$tip.style.left = e.pageX + 'px';
            this.$tip.style.top = e.pageY + 'px';
            this.$tip.textContent = content;
            this.$tip.style.display = 'block';
        },
        onHideMenu() {
            const { editor } = this;
            editor.contextmenu.menu.isShow = false;
            this.menu.show = false;
        },
        clearKeyboardAction(e) {
            if ((this.isShiftMode && !e.shiftKey) || (this.action === 'meta' && !getMetaKey(e))) {
                this.action = '';
                this.$refs.wrap.focus();
            }
            this.acting = false;
        },
        // 阻止点击画布坐标选中元素
        handleWrapClick(e) {
            e.stopPropagation();
        },
        /**
         * 获取表格列最小宽度
         * 字号决定最小宽度
         */
        _getTableColsMinWidths() {
            const { cells } = this;
            const fontSizes = new Array(cells[0].length).fill(0);
            fontSizes.forEach((_, i) => {
                let fontSize = 20;
                for (let r = 0; r < cells.length; r++) {
                    const row = cells[r];
                    const cell = row[i];
                    if (cell) {
                        fontSize = Math.max(fontSize, cell.$style.fontSize);
                    }
                }
                fontSizes[i] = fontSize;
            });
            return {
                minWidths: fontSizes,
                tableMinWidth: fontSizes.reduce((a, b) => a + b, 0),
            };
        },
        handleTransformMouseenter(e, grip) {
            this.prepareType = grip === 's' ? 'r' : 'c';
        },
        handleTransformMouseleave() {
            this.prepareType = '';
        },
        copyCellContent() {
            const { range } = this;
            if (!range) return false;
            this.model.syncTableData();
            let _tableData = cloneDeep(this.model.tableData);
            _tableData = copyPartialTable(_tableData, range);
            this.editor.clipboard = _tableData;
        },
        async pasteCellContent(tableInfo) {
            const { range } = this;
            if (!range) return false;

            const curCell = this.cells[range.row - 1][range.col - 1];
            if (!curCell) return false;

            if (tableInfo) this.editor.clipboard = tableInfo;
            if (!this.editor.clipboard || !this.editor.clipboard.cells) return;

            const { cells, styles = [] } = this.editor.clipboard;

            // 样式复制
            Object.keys(styles).forEach((id) => {
                if (!this.model.$styleMap.has(id)) {
                    this.model.$styleMap.set(id, styles[id]);
                }
            });

            // 填充单元格
            padCells(this.editor, this.model, cells, range);

            this.collectTableInfo();
            this._shotTable({ fixed: false });
        },
        getCellHandlerStyle(col, rIdx, cIdx) {
            const { cells, editCell } = this;
            return {
                top: col.top + 2 + 'px',
                left: col.left + 2 + 'px',
                width: col.contentWidth - 4 + 'px',
                height: col.contentHeight - 4 + 'px',
                display: !(cells[rIdx] && cells[rIdx][cIdx]) ? 'none' : '',
                pointerEvents:
                    editCell && cIdx + 1 === editCell.col && rIdx + 1 === editCell.row && 'none',
            };
        },
        // 恢复wrap尺寸样式
        _recoverWrapSizeStyle() {
            const $table = this.getTableDom();
            this.$refs.tableWrap.style.width = $table.offsetWidth + 'px';
            this.$refs.tableWrap.style.height = $table.offsetHeight + 'px';
        },
        async handleInputPaste(e) {
            let cacheClipboard = this.editor.clipboard; // 内部可能被全局剪贴板内容覆盖
            if (getOuterTableClipboard()) {
                cacheClipboard = null;
            }
            const pasteText = await e.clipboardData.getData('text/html');
            if (pasteText) {
                const pasteTableInfo = parseTableHtml(pasteText);
                conformTableClipboard(pasteTableInfo, this.editor);
            }
            if (this.range) {
                if (
                    (this.range.rowspan === 1 && this.range.colspan === 1) ||
                    canMergeCells(this.cells, this.range)
                ) {
                    const acting = `paste$${this.range.row}${this.range.col}`;
                    if (this.acting !== acting) {
                        this.pasteCellContent(cacheClipboard);
                        this.acting = acting;
                    }
                }
            }
        },
        initMergeEvent() {
            this.editor.$events.$on('table.mergeCell', this.onMergeCell);
            this.editor.$events.$on('table.splitCell', this.onMergeCell);
        },
        clearMergeEvent() {
            this.editor.$events.$off('table.mergeCell', this.onMergeCell);
            this.editor.$events.$off('table.splitCell', this.onMergeCell);
        },
        onMergeCell() {
            this.$refs.wrap.focus();
            this.collectTableInfo();
        },
    },
};
</script>
<style lang="less">
@handle-size: 12px;

.table-controller {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    outline: none;

    * {
        box-sizing: border-box;
    }

    &__all {
        position: absolute;
        z-index: 3;
        left: -@handle-size;
        top: -@handle-size;
        width: @handle-size;
        height: @handle-size;
        padding: 1px;
        rect {
            fill: #d0e1ea;
        }
        &:hover {
            rect {
                fill: #4d7cff;
            }
        }
    }

    &__table-wrap {
        transform-origin: top left;
    }

    &__ranger {
        position: absolute;
        pointer-events: none;
        display: none;

        &__border {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            box-shadow: 0 0 0 1px #fff inset;
            border: 2px solid #4d7cff;
        }

        &--col-full &__border {
            &:before {
                content: '';
                position: absolute;
                top: -14px;
                left: -2px;
                width: calc(100% + 4px);
                height: 12px;
                background-color: #4d7cff;
                pointer-events: none;
            }
        }
        &--row-full &__border {
            &:after {
                content: '';
                position: absolute;
                top: -2px;
                left: -14px;
                height: calc(100% + 4px);
                width: 12px;
                background-color: #4d7cff;
                pointer-events: none;
            }
        }

        &__vain {
            position: absolute;
            left: 0;
            top: 0;
            width: 0;
            height: 0;
            border: 1px solid #000;
        }

        &__cube {
            position: absolute;
            right: -5px;
            bottom: -5px;
            width: 10px;
            height: 10px;
            pointer-events: all;
            &:before {
                content: '';
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 6px;
                height: 6px;
                background-color: #4d7cff;
                border: 1px solid #fff;
            }
        }
    }

    &--editing &__ranger__border {
        box-shadow: 0 0 0 2px rgba(77, 124, 255, 0.5);
    }

    &__del-strip-btn {
        display: none;
        position: absolute;
        z-index: 3;
        width: 22px;
        height: 22px;
        justify-content: center;
        align-items: center;
        background-color: white;
        border: 1px solid #ccd1da;
        border-radius: 1px;
        pointer-events: all;
        svg {
            fill: #000;
        }
        &:hover {
            background-color: #f54531;
            border: none;
            svg {
                fill: #fff;
            }
        }
    }

    &__menu-wrap {
        z-index: 9;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        > ul {
            pointer-events: all;
        }
    }

    &__cell-controller {
        position: absolute;
        > div {
            position: absolute;
        }
    }

    &__prepare-handle {
        .table-strips__line:after {
            transition: background-color 300ms 300ms;
            background-color: #4d7cff;
        }
    }
    &--copy {
        .table-strips__line {
            display: none;
        }
    }

    .table-main__content {
        cursor: inherit;
    }
    &--editing {
        .table-main__content {
            cursor: text;
        }
    }

    &__paste-input {
        position: absolute;
        z-index: -3;
        opacity: 0;
    }
}

.table-controller--style-disabled {
    .table-controller-handle,
    .table-controller__all,
    .table-controller__menu-wrap,
    .table-controller-transform__grip,
    .table-controller-transform__rotator,
    .table-controller-transform__translator,
    .table-controller__del-strip-btn {
        display: none !important;
    }
}

#__editor-controller-tip__ {
    position: fixed;
    margin-left: 20px;
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    font-style: normal;
    font-weight: normal;
    line-height: 28px;
    color: white;
    background: #0e1217;
    border-radius: 4px;
    pointer-events: none;
}
</style>
