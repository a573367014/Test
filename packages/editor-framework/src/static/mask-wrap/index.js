import template from './template.html';
import Matrix from '@gaoding/editor-utils/matrix';

export default {
    props: ['model', 'options', 'global', 'editor', 'elements', 'maskInfoElement'],
    name: 'mask-wrap',
    template,
    computed: {
        /**
         * 反转 maskInfoElement 的矩阵
         */
        reversedMaskInfoElementMatrix() {
            const maskInfoElement = this.maskInfoElement;
            const { a, b, c, d, tx, ty } = maskInfoElement.transform.localTransform;
            const reversedMatrix = new Matrix(a, b, c, d, tx, ty).invert();
            return {
                'transform-origin': this.maskInfoElementTransformOrigin,
                transform: this.matrix2Str(reversedMatrix),
            };
        },
        /**
         * 反转 maskInfoElement 的偏移量
         */
        reversedMaskInfoElementOffset() {
            const maskInfoElement = this.maskInfoElement;
            const effectedResult = maskInfoElement.maskInfo.effectedResult;
            const zoom = this.global.zoom;
            const left = (-maskInfoElement.left - effectedResult.left) * zoom;
            const top = (-maskInfoElement.top - effectedResult.top) * zoom;
            return {
                transform: `translate(${left}px, ${top}px)`,
            };
        },
        /**
         * 计算 maskInfoElement 出图后的 transform-origin
         */
        maskInfoElementTransformOrigin() {
            const zoom = this.global.zoom;
            const maskInfoElement = this.maskInfoElement;
            const effectedResult = maskInfoElement.maskInfo.effectedResult;
            const left = effectedResult.left * zoom;
            const top = effectedResult.top * zoom;
            const width = maskInfoElement.width * zoom;
            const height = maskInfoElement.height * zoom;
            return `${width / 2 - left}px ${height / 2 - top}px`;
        },
        maskStyle() {
            const zoom = this.global.zoom;
            const maskInfoElement = this.maskInfoElement;
            const {
                maskInfo: { imageUrl, effectedResult },
                transform: { localTransform },
                type,
            } = maskInfoElement;
            let realWidth = effectedResult.width * zoom;
            let realHeight = effectedResult.height * zoom;
            if (type === 'svg') {
                realWidth = maskInfoElement.width * zoom;
                realHeight = maskInfoElement.height * zoom;
            }
            const left = (maskInfoElement.left + effectedResult.left) * zoom;
            const top = (maskInfoElement.top + effectedResult.top) * zoom;
            return {
                transform: this.matrix2Str(localTransform),
                'transform-origin': this.maskInfoElementTransformOrigin,
                'mask-image': `url(${imageUrl})`,
                width: realWidth + 'px',
                height: realHeight + 'px',
                top: top + 'px',
                left: left + 'px',
            };
        },
    },
    methods: {
        matrix2Str(matrix) {
            const transformList = [matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty];
            return `matrix(${transformList.join(',')})`;
        },
    },
};
