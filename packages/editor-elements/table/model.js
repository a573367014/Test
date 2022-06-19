import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import { set, isEqual, cloneDeep, pickBy, get, clone } from 'lodash';
import { CellModel, dlzBorders, dlzPadding, get4SizeNames } from './cell-model';
import TableRenderer from './table-renderer';
import {
    convertObsoleteTableData,
    convertOldTable,
    createTableDom,
    genStyleId,
    getTableMinSize,
    resizeTable,
} from './utils';

class Table extends BaseModel {
    constructor(data) {
        // 过滤metaInfo中的冗余字体信息
        if (get(data, 'metaInfo.materials')) {
            set(
                data,
                'metaInfo.materials',
                data.metaInfo.materials.filter((item) => item.type !== 'font'),
            );
        }
        if (!data.fontFamily) {
            data.fontFamily = 'SourceHanSansSC-Regular';
        }
        convertOldTable(data);
        convertObsoleteTableData(data);
        super(data);

        this._init(data.tableData);

        this.$getResizeLimit = () => {
            const minSize = getTableMinSize(this);
            return {
                maxWidth: Infinity,
                maxHeight: Infinity,
                minWidth: minSize.width,
                minHeight: minSize.height,
            };
        };
    }

    _currentRange = null;

    get $currentRange() {
        return this._currentRange;
    }

    set $currentRange(range) {
        this._currentRange = range;
    }

    set $tableData(v) {
        this.tableData = v;
        this._init(v);
    }

    $lastRange = null;
    $lastStyleId = null;

    $cells = [];

    $styleMap = new Map();

    _init(tableData) {
        this.$styleMap = new Map(Object.entries(tableData.styles));
        this.$cells = [];

        // 样式数据展开
        this.$styleMap.forEach((style) => {
            if (style.borders) {
                Object.assign(style, dlzBorders(style.borders));
                delete style.borders;
            }
            if (style.padding) {
                Object.assign(style, dlzPadding(style.padding));
                delete style.padding;
            }
        });

        tableData.cells.forEach((row, rIdx) => {
            const _row = [];
            row.forEach((cell, cIdx) => {
                _row.push(
                    cell ? new CellModel(cell, { table: this, position: [rIdx, cIdx] }) : null,
                );
            });
            this.$cells.push(_row);
        });
    }

    getCurrentStyleId() {
        if (isEqual(this.$lastRange, this.$currentRange) && this.$lastStyleId) {
            return this.$lastStyleId;
        }
        const style = {};
        const key = genStyleId(this.tableData.styles);
        this.tableData.styles[key] = style;
        this.$styleMap.set(key, style);
        this.$lastStyleId = key;
        this.$lastRange = this.$currentRange;
        return this.$lastStyleId;
    }

    getCurrentStyle() {
        return this.$styleMap.get(this.getCurrentStyleId());
    }

    resizeTable(ratio) {
        resizeTable(this, ratio);
    }

    load() {
        this.syncTableData();
        this._init(this.tableData);
    }

    render(editor) {
        return this.renderImage(editor).then((img) => {
            const canvas = createCanvas(this.width, this.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, this.width, this.height);
            return canvas;
        });
    }

    renderImage(editor) {
        const $table = createTableDom(editor, this);
        const cloneNode = $table.cloneNode(true);

        // table出图内容展示优先级高于尺寸
        // 获取table dom尺寸(table可见尺寸可能大于size)
        Object.assign(cloneNode.style, {
            width: this.width + 'px',
            height: this.height + 'px',
        });
        document.body.appendChild(cloneNode);
        this.width = cloneNode.offsetWidth;
        this.height = cloneNode.offsetHeight;

        // 1px边框缩放视觉还原
        try {
            const zoom = editor.zoom;
            if (zoom < 1) {
                let borderWidth = 0;
                const firstCell = this.$cells[0][0];
                get4SizeNames('border').forEach((name) => {
                    name += 'Width';
                    borderWidth = Math.max(borderWidth, firstCell.$style[name]);
                });
                if (borderWidth === 1) {
                    cloneNode.querySelectorAll('tbody>tr>td').forEach(($td) => {
                        $td.style.borderWidth = '1px';
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }

        document.body.removeChild(cloneNode);

        const tableRenderer = new TableRenderer(
            this,
            TableRenderer.node2String(cloneNode, this),
            editor,
        );

        return tableRenderer.renderImage();
    }

    getFontFamilies() {
        const list = [];
        this.$styleMap.forEach((style) => {
            if (style.fontFamily && !list.includes(style.fontFamily)) {
                list.push(style.fontFamily);
            }
        });
        return list;
    }

    getColors() {
        const colors = [];
        this.$styleMap.forEach((style) => {
            const colorStyle = pickBy(style, (v, k) => {
                return /color$/i.test(k);
            });
            colors.push(...Object.values(colorStyle));
        });
        return colors;
    }

    exportData() {
        this.syncTableData();
        return this;
    }

    /**
     * 同步表格数据
     */
    syncTableData() {
        const _model = this;
        const cells = [];
        const usedStyleMap = {};
        _model.$cells.forEach((row) => {
            const _row = [];
            row.forEach((cell) => {
                _row.push(cell ? cell.toObject() : null);
                if (!cell) return;
                const styleIds = cell.styleIds;
                const cellStyle = {};
                for (let i = styleIds.length - 1; i >= 0; i--) {
                    const id = styleIds[i];
                    const curStyle = clone(_model.$styleMap.get(id));
                    if (!curStyle) continue;
                    const cellStyleKeys = Object.keys(cellStyle);
                    const curStyleKeys = Object.keys(curStyle);
                    let existCount = 0;
                    for (let j = 0; j < curStyleKeys.length; j++) {
                        const key = curStyleKeys[j];
                        if (!cellStyleKeys.includes(key)) break;
                        existCount++;
                    }
                    if (existCount === curStyleKeys.length) {
                        cell.styleIds.splice(i, 1);
                    } else {
                        Object.assign(cellStyle, curStyle);
                        !usedStyleMap[id] && (usedStyleMap[id] = true);
                    }
                }
            });
            cells.push(_row);
        });

        const styles = {};
        // 冗余样式过滤
        _model.$styleMap.forEach((style, id) => {
            if (
                usedStyleMap[id] ||
                [_model.tableData.all, ..._model.tableData.rules].find((d) => d.styleId === id)
            ) {
                const _style = { ...style };

                // 样式数据压缩
                get4SizeNames('border').forEach((name, i) => {
                    if (_style[name + 'Style']) {
                        !_style.borders && (_style.borders = new Array(4).fill(null));
                        _style.borders[i] = {
                            style: _style[name + 'Style'],
                            width: _style[name + 'Width'],
                            color: _style[name + 'Color'],
                        };
                        delete _style[name + 'Style'];
                        delete _style[name + 'Width'];
                        delete _style[name + 'Color'];
                    }
                });

                // 简化边框
                if (
                    _style.borders &&
                    isEqual(_style.borders[0], _style.borders[0]) &&
                    isEqual(_style.borders[0], _style.borders[1]) &&
                    isEqual(_style.borders[0], _style.borders[2]) &&
                    isEqual(_style.borders[0], _style.borders[3])
                ) {
                    _style.borders = [_style.borders[0]];
                }

                if (_style.paddingTop) {
                    _style.padding = [_style.paddingTop];
                    get4SizeNames('padding').forEach((name) => {
                        delete _style[name];
                    });
                }
                styles[id] = _style;
            }
        });
        _model.tableData.cells = cells;
        _model.tableData.styles = styles;
    }

    /**
     * 更新样式
     */
    changeStyle(props) {
        if (!props) return;

        const styleId = this.getCurrentStyleId();
        const style = this.$styleMap.get(styleId);
        Object.assign(style, props);

        const range = this.$currentRange || {
            row: 1,
            col: 1,
            rowspan: this.$cells.length,
            colspan: this.$cells[0].length,
        };
        for (let r = range.row - 1; r < range.row + range.rowspan - 1; r++) {
            for (let c = range.col - 1; c < range.col + range.colspan - 1; c++) {
                const cell = this.$cells[r][c];
                if (cell) {
                    Object.assign(cell.$style, cloneDeep(style));
                    if (!cell.styleIds.includes(styleId)) {
                        cell.styleIds.push(styleId);
                    }
                }
            }
        }
    }
}

export default Table;
