import { getCutGridData } from '@gaoding/editor-utils/cut-grid';
import tinycolor from 'tinycolor2';
import template from './cut-grid.html';

export default {
    name: 'cut-grid',
    template,
    props: ['options', 'global', 'layout'],
    data() {
        return {};
    },
    computed: {
        gapColor() {
            return tinycolor(this.gridData.gapColor).toString('rgb');
        },
        gridData() {
            const { rows, columns, colGapsLeft, rowGapsTop } = getCutGridData(
                this.layout,
                this.grid,
            );

            return {
                ...this.grid,
                rows,
                columns,
                colGapsLeft,
                rowGapsTop,
            };
        },

        grid() {
            return this.global.cutGuide.grid;
        },

        zoom() {
            return this.global.zoom;
        },

        editor() {
            return this.$parent;
        },

        xLinesStyle() {
            const { gapSize } = this.gridData;
            return this.gridData.colGapsLeft.map((v) => {
                return {
                    left: Math.round((v - 2) * this.zoom) + 'px',
                    width: Math.round(Math.max(1, gapSize * this.zoom)) + 'px',
                    backgroundColor: this.gapColor,
                };
            });
        },

        yLinesStyle() {
            const { gapSize } = this.gridData;
            return this.gridData.rowGapsTop.map((v) => {
                return {
                    top: Math.round((v - 2) * this.zoom) + 'px',
                    height: Math.round(Math.max(1, gapSize * this.zoom)) + 'px',
                    backgroundColor: this.gapColor,
                };
            });
        },
    },
};
