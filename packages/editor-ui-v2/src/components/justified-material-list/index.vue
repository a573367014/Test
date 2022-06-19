<template>
    <Scroll
        :lazy-scroll="lazyScroll"
        :height="listHeight"
        :list="layoutBoxes"
        :buffer="buffer"
        @before-leave="handleBeforeLeave">
        <template slot="before">
            <slot name="before" />
        </template>
        <template v-slot:default="{ row, index: rowNum }">
            <div
                v-for="(item, idx) in row"
                :key="item.id || idx"
                ref="box"
                class="eui-v2-justified-material-list__item item-loading"
                :class="{ 'item-dragging': draggedItem && draggedItem.id === item.id }"
                @click="$emit('click', $event, item, item.index)"
                @mousedown="$emit('mousedown', $event, item, item.index)"
                :style="Object.assign({
                    transform: `translateX(${item.left}px)`,
                    width: item.width + 'px',
                    height: item.height + 'px',
                    borderRadius: itemBorderRadius + 'px',
                    opacity: draggedItem && draggedItem.id === item.id ? 0 : 1,
                }, loadingAnimation(item, idx))">
                <slot
                    v-if="useScopedSlot"
                    :index="item.index"
                    :render-index="idx"
                    :item="item"
                    :rowNum="rowNum"
                    :getImageSrc="getImageSrc"
                    :getImageStyle="getImageStyle"
                    :getPreviewStyle="getPreviewStyle"
                    :handleLoad="handleLoad"/>

                <component
                    v-else-if="container"
                    :is="container"
                    v-bind="{[containerPropName]: item}">
                    <img draggable="false" :src="getImageSrc(item)" :style="getPreviewStyle(item)" @load="handleLoad(rowNum, idx, item)">
                    <i class="eui-v2-justified-material-list__transparency" v-if="showTransparency" :style="getImageStyle(item)"/>
                    <slot :index="item.index" :item="item"/>
                </component>
                <template v-else>
                    <img
                        draggable="false"
                        :src="getImageSrc(item)"
                        :data-id="item.id"
                        :style="getPreviewStyle(item)"
                        @load="handleLoad(rowNum, idx, item)">
                    <i class="eui-v2-justified-material-list__transparency" v-if="showTransparency" :style="getImageStyle(item)"/>
                    <slot :index="item.index" :item="item" />
                </template>
            </div>
        </template>
        <template slot="after">
            <slot name="after" />
        </template>
    </Scroll>
</template>

<script>
import Scroll from './scroll';
import justifiedLayout from 'justified-layout';
import { ossUrl } from '../../utils/oss';

export default {
    components: {
        Scroll
    },
    props: {
        list: {
            type: Array,
            default: () => []
        },
        boxWidth: {
            type: [String, Number],
            default: 'auto'
        },
        boxHeight: {
            type: [String, Number],
            default: 'auto'
        },
        rowHeight: {
            type: Number,
            default: 140
        },
        rowWidth: {
            type: Number,
            default: 280
        },
        rowLimit: {
            type: Number,
            default: Infinity
        },
        draggedItem: {
            type: Object,
            default: null,
        },
        minAspectRatio: {
            type: Number,
            default: 0
        },
        boxSpacing: {
            type: Number,
            default: 8,
        },
        tolerance: {
            type: Number,
            default: 0.1,
        },
        container: {
            type: [Object, String],
            default: () => ''
        },
        containerPropName: {
            type: String,
            default: 'material'
        },
        // mounted 时才能获取到 $scopedSlots
        useScopedSlot: {
            type: Boolean,
            default: false
        },
        showTransparency: {
            type: Boolean,
            default: false
        },
        fit: {
            type: Boolean,
            default: false
        },
        itemBorderRadius: {
            type: Number,
            default: 0,
        },
        lazyScroll: {
            type: Boolean,
            default: false
        },
        buffer: {
            type: Number,
            default: 200
        }
    },
    data() {
        return {
            layoutBoxes: [],
            listHeight: 0,
        };
    },
    watch: {
        list() {
            this.calcLayout();
        }
    },
    created() {
        this.calcLayout();
    },
    methods: {
        calcLayout() {
            this._calcLayout();
            // 行数限制
            if(
                this.rowLimit !== Infinity &&
                this.rowLimit > 0 &&
                this.layoutBoxes.length
            ) {
                this.layoutBoxes = this.layoutBoxes.slice(0, this.rowLimit);

                const lastRow = this.layoutBoxes[this.layoutBoxes.length - 1];
                this.listHeight = lastRow[0].top + lastRow[0].height;
            }
        },
        _calcLayout() {
            const list = this.list;
            if(!list || !list.length) {
                return this.reset();
            }

            const layoutItems = list.map((item) => {
                const preview = Object.assign({}, item.preview);
                preview.width = preview.width || 100;
                preview.height = preview.height || 100;
                if(this.boxWidth !== 'auto') {
                    preview.width = this.boxWidth;
                }
                if(this.boxHeight !== 'auto') {
                    preview.height = this.boxHeight;
                }
                const aspectRatio = preview.width / preview.height;
                if(aspectRatio < this.minAspectRatio) {
                    preview.width = preview.height * this.minAspectRatio;
                }
                return preview;
            });
            const layoutGeometry = justifiedLayout(layoutItems, {
                targetRowHeightTolerance: this.tolerance,
                containerPadding: 0,
                boxSpacing: this.boxSpacing,
                containerWidth: this.rowWidth,
                targetRowHeight: this.rowHeight,
                // 只有一个元素时需要和容器一样宽
                fullWidthBreakoutRowCadence: this.list.length === 1
            });
            const layoutBoxes = layoutGeometry.boxes
                .map((box, idx) => Object.assign({ index: idx, loaded: false }, layoutItems[idx], box, this.list[idx]))
                .reduce((rows, box, idx, boxes) => {
                    const prevBox = boxes[idx - 1] || { top: 0 };
                    const lastRow = rows[rows.length - 1];
                    if(box.top === prevBox.top) {
                        lastRow.push(box);
                    }
                    else {
                        rows.push([box]);
                    }
                    return rows;
                }, [[]]);

            this.listHeight = layoutGeometry.containerHeight;
            this.layoutBoxes = layoutBoxes;
        },
        reset() {
            this.listHeight = 0;
            this.layoutBoxes = [];
        },
        getPreviewStyle(material) {
            const { fit } = this;
            if(fit) {
                return {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top'
                };
            }
            else {
                return this.getImageStyle(material);
            }
        },
        getImageStyle(material) {
            if(!material || !material.preview) return { width: 0, height: 0 };
            const ratio = material.preview.width / material.preview.height;
            const width = Math.min(material.width, material.height * ratio);
            const height = Math.min(material.height, material.width / ratio);

            return {
                width: width + 'px',
                height: height + 'px'
            };
        },
        getImageSrc(material) {
            const reDataURL = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;
            const reBlobURL = /^blob:/;
            if(material.preview && material.preview.url) {
                const { url } = material.preview;
                if(url.includes('.svg')) return url;

                if(reDataURL.test(url) || reBlobURL.test(url)) {
                    return url;
                }
                else {
                    const { fit } = this;
                    let { width, height } = material;

                    if(fit) {
                        const { preview } = material;
                        const ratio = preview.width / preview.height;
                        height = width / ratio;
                    }
                    return ossUrl(url, { width: width, height: height, scaleType: 'lfit', resizeType: 6 });
                }
            }
            return null;
        },
        loadingAnimation(material, index) {
            if(!material.loaded) {
                return {
                    backgroundColor: '#f8fafc',
                    animationDelay: `${1.4 * Math.floor(index / 6)}s`,
                    animationName: `loading-animation-${index % 6}`
                };
            }
            return null;
        },
        handleLoad(rowNum, idx, item) {
            item.loaded = true;
            if(typeof item.index === 'number' && this.list[item.index]) {
                this.list[item.index].loaded = true;
            }
        },
        handleBeforeLeave(el) {
            el.style.opacity = 0;
        }
    }
};
</script>

<style lang="less">
.eui-v2-justified-material-list {
    position: relative;
    user-select: none;

    &__row {
        position: absolute;
    }

    &__item {
        font-size: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: absolute;
        cursor: pointer;

        &_hover-dark {
            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, .1);
                z-index: 1;
                // display: none;
                opacity: 0;
                transition: opacity .2s ease-out;
                border-radius: 4px;
            }

            &:hover{
                &::before {
                    display: block;
                    opacity: 1;
                }
            }
        }

        img {
            user-select: none;
            pointer-events: none;
        }
    }

    &__transparency {
        @size: 4px;
        background-image: linear-gradient(to top right, #F4F4F4 25%, transparent 25%, transparent 75%, #F4F4F4 75%, #F4F4F4), linear-gradient(to top right, #F4F4F4 25%, transparent 25%, transparent 75%, #F4F4F4 75%, #F4F4F4);
        background-size: @size * 2 @size * 2;
        background-position: 0 0, @size @size;
        position: absolute;
        z-index: -1;
    }

    .squeeze-enter-active {
        transition: all .3s;
    }
    .squeeze-enter {
        width: 0 !important;
        min-width: 0!important;
    }
}

.eui-v2-justified-material-scroll {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
}
</style>
