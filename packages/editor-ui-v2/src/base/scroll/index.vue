<style lang="less">
    .eui-v2-scroll {
        overflow: auto;

        &__body {
            position: relative;
            display: block;

            &__item {
                position: absolute;
                left: 0;
                top: 0;
            }
        }
    }
</style>

<template>
    <div class="eui-v2-scroll" @scroll="onScroll">
        <slot name="before"></slot>
        <div class="eui-v2-scroll__body" :style="scrollBodyStyle" ref="wrap">
            <div
                class="eui-v2-scroll__body__item"
                v-for="(item, index) in visibleList"
                :key="item.key"
                :style="[getItemTransform(item), item.style]">
                <slot :item="item.data" :index="index" :itemSize="item.itemSize" :alignSize="item.alignSize"/>
            </div>
        </div>
        <slot name="after"></slot>
    </div>
</template>

<script>
import throttle from 'lodash/throttle';

export default {
    props: {
        list: {
            type: Array,
            default: () => []
        },
        maxAlignSize: {
            type: Number,
            default: 0
        },
        itemSize: {
            type: [Number, Function],
            default: 10
        },
        alignSize: {
            type: [Number, Function],
            default: 0
        },
        itemKey: {
            type: String,
            default: ''
        },
        scroll: {
            type: String,
            default: 'y'
        },
        buffer: {
            type: Number,
            default: 200
        },
        itemStyle: {
            type: [Array, String, Function],
            default: ''
        },
        getItemSize: {
            type: [Function, Boolean],
            default: false
        }
    },
    data() {
        return {
            scrollOffset: 0,
            ready: false
        };
    },
    computed: {
        innerList() {
            const { list, itemSize, alignSize, maxAlignSize, getItemSize } = this;
            const itemSizeIsFucntion = typeof itemSize === 'function';
            const alignSizeIsFunction = typeof alignSize === 'function';
            const innerList = {
                totalSize: 0,
                items: []
            };
            let emptyBoxList = [{
                scrollOffset: 0,
                alignOffset: 0,
                alignSize: maxAlignSize
            }];
            let totalSize = 0;
            list.forEach((item, index) => {
                let _itemSize;
                let _alignSize;
                if(typeof getItemSize === 'function') {
                    const itemSizeResult = getItemSize(item, index);
                    _itemSize = itemSizeResult.itemSize;
                    _alignSize = itemSizeResult.alignSize;
                }
                else {
                    _itemSize = Math.round(itemSizeIsFucntion ? itemSize(item, index) : itemSize);
                    _alignSize = Math.round(alignSizeIsFunction ? alignSize(item, index) : alignSize);
                }

                const {
                    scrollOffset,
                    alignOffset
                } = this.getInsertBox(emptyBoxList, _itemSize, _alignSize);

                const innerItem = {
                    scrollOffset: scrollOffset,
                    alignOffset: alignOffset,
                    data: item,
                    key: this.getItemKey(item, index),
                    style: this.getItemStyle(item, index),
                    itemSize: _itemSize,
                    alignSize: _alignSize
                };

                innerList.items.push(innerItem);
                emptyBoxList = this.updateEmptyBox(emptyBoxList, innerItem);

                if(innerItem.scrollOffset + innerItem.itemSize > totalSize) {
                    totalSize = innerItem.scrollOffset + innerItem.itemSize;
                }
            });

            innerList.totalSize = totalSize;
            return innerList;
        },
        totalSize() {
            const { innerList } = this;
            return innerList.totalSize;
        },
        scrollBodyStyle() {
            const { totalSize, sizeKey } = this;

            return {
                [sizeKey]: `${totalSize}px`,
            };
        },
        visibleList() {
            const { scrollOffset, buffer, totalSize, innerList, offsetKey, clientKey, ready } = this;
            if(!ready) return [];
            const offset = this.$refs.wrap ? this.$refs.wrap[offsetKey] : 0;
            const size = this.$el ? this.$el[clientKey] : 0;
            const minSentinels = Math.min(Math.max(scrollOffset - offset - buffer, 0), totalSize);
            const maxSentinels = Math.min(Math.max(scrollOffset + size + buffer - offset, 0), totalSize);
            const startIndex = this.findItemByScrollOffset(minSentinels, 'min', 0, innerList.items.length);
            const endIndex = this.findItemByScrollOffset(maxSentinels, 'max', startIndex, innerList.items.length);
            return innerList.items.slice(startIndex, endIndex + 1);
        },
        scrollKey() {
            return this.scroll === 'y' ? 'scrollTop' : 'scrollLeft';
        },
        sizeKey() {
            return this.scroll === 'y' ? 'min-height' : 'min-width';
        },
        offsetKey() {
            return this.scroll === 'y' ? 'offsetTop' : 'offsetLeft';
        },
        clientKey() {
            return this.scroll === 'y' ? 'clientHeight' : 'clientWidth';
        }
    },
    mounted() {
        this.ready = true;
    },
    methods: {
        getItemKey(item, index) {
            const { itemKey } = this;
            if(itemKey) {
                return item[itemKey];
            }
            return index;
        },
        getItemTransform(item) {
            const { scroll } = this;
            const scrollOffset = `${item.scrollOffset}px`;
            const alignOffset = `${item.alignOffset}px`;
            const style = scroll === 'y' ? [alignOffset, scrollOffset] : [scrollOffset, alignOffset];
            return {
                transform: `translate(${style.join(',')})`
            };
        },
        onScroll(e) {
            if(!this._lazyOnScroll) {
                this._lazyOnScroll = throttle((e) => {
                    const { scrollKey } = this;
                    this.scrollOffset = e.target[scrollKey];
                }, 50, { leading: true });
            }

            this._lazyOnScroll(e);
        },
        findItemByScrollOffset(offset, flag, startIndex, endIndex) {
            const { innerList } = this;
            const items = innerList.items;
            const middle = Math.floor((startIndex + endIndex) / 2);
            const item = items[middle];
            if(!item) {
                return -1;
            }
            if(startIndex === endIndex) {
                return middle;
            }

            else if(flag === 'min') {
                if(middle === 0 || (item.scrollOffset + item.itemSize >= offset && items[middle - 1].scrollOffset + items[middle - 1].itemSize < offset)) {
                    return middle;
                }
            }
            else if(flag === 'max') {
                if(middle === items.length - 1 || (item.scrollOffset <= offset && items[middle + 1].scrollOffset > offset)) {
                    return middle;
                }
            }

            const scrollOffset = flag === 'min' ? item.scrollOffset + item.itemSize : item.scrollOffset;
            if(scrollOffset > offset || (flag === 'min' && item.scrollOffset === offset)) {
                return this.findItemByScrollOffset(offset, flag, startIndex, middle);
            }
            else {
                return this.findItemByScrollOffset(offset, flag, middle + 1, endIndex);
            }
        },
        getItemStyle(item, index) {
            const { itemStyle } = this;
            if(typeof itemStyle === 'function') {
                return itemStyle(item, index);
            }
            return itemStyle;
        },

        /**
         * 计算元素可插入滚动条的位置
         * @param { Array<{ scrollOffset: Number, alignOffset, alignSize: Number }> } emptyBoxList - 空余容器数组
         * @param { Number } itemSize - 插入元素的尺寸
         * @param { Number } alignSize - 插入元素的宽度
         */
        getInsertBox(emptyBoxList, itemSize, alignSize) {
            let emptyBox = null;
            emptyBoxList.forEach((box, index) => {
                if(!emptyBox && (box.alignSize >= alignSize || index === emptyBoxList.length - 1)) {
                    emptyBox = box;
                }
            });
            return {
                scrollOffset: emptyBox.scrollOffset,
                alignOffset: emptyBox.alignOffset
            };
        },

        /**
         * 更新空余空间列表
         * @param { Array<{ scrollOffset: Number, alignOffset, alignSize: Number }> } emptyBoxList - 空余容器数组
         * @param { { scrollOffset: Number, alignOffset, alignSize: Number, itemSize: Number } } insertBox - 新插入元素所占位置
         */
        updateEmptyBox(emptyBoxList, insertBox) {
            const newList = [];
            let newEmptyOffsetStart = insertBox.alignOffset;
            let newEmptyOffsetEnd = insertBox.alignOffset + insertBox.alignSize;

            emptyBoxList.forEach(emptyBox => {
                if(
                    emptyBox.scrollOffset <= insertBox.scrollOffset + insertBox.itemSize
                    // !(emptyBox.alignOffset >= insertBox.alignOffset + insertBox.alignSize ||
                    // emptyBox.alignOffset + emptyBox.alignSize <= insertBox.alignOffset)
                ) {
                    // 空余空间被插入空间覆盖时，移除该空余空间
                    if(
                        emptyBox.alignOffset >= insertBox.alignOffset &&
                        emptyBox.alignOffset + emptyBox.alignSize <= insertBox.alignOffset + insertBox.alignSize
                    ) {
                        return;
                    }

                    // 空余空间右侧与插入空间有重叠
                    if(
                        emptyBox.alignOffset < insertBox.alignOffset &&
                        emptyBox.alignOffset + emptyBox.alignSize > insertBox.alignOffset
                    ) {
                        newList.push({
                            alignOffset: emptyBox.alignOffset,
                            alignSize: insertBox.alignOffset - emptyBox.alignOffset,
                            scrollOffset: emptyBox.scrollOffset
                        });
                        if(emptyBox.alignOffset < newEmptyOffsetStart) {
                            newEmptyOffsetStart = emptyBox.alignOffset;
                        }
                    }

                    // 空余空间左侧与插入空间右侧有重叠
                    if(
                        emptyBox.alignOffset < insertBox.alignOffset + insertBox.alignSize &&
                        emptyBox.alignOffset + emptyBox.alignSize > insertBox.alignOffset + insertBox.alignSize
                    ) {
                        newList.push({
                            alignOffset: insertBox.alignOffset + insertBox.alignSize,
                            alignSize: emptyBox.alignOffset + emptyBox.alignSize - (insertBox.alignOffset + insertBox.alignSize),
                            scrollOffset: emptyBox.scrollOffset
                        });
                        if(emptyBox.alignOffset + emptyBox.alignSize > newEmptyOffsetEnd) {
                            newEmptyOffsetEnd = emptyBox.alignOffset + emptyBox.alignSize;
                        }
                    }
                }
                else {
                    newList.push(emptyBox);
                }
            });

            if(!newList.some(emptyBox => {
                return emptyBox.scrollOffset <= insertBox.scrollOffset + insertBox.itemSize &&
                    emptyBox.alignOffset <= newEmptyOffsetStart &&
                    emptyBox.alignOffset + emptyBox.alignSize >= newEmptyOffsetEnd;
            })) {
                newList.push({
                    scrollOffset: insertBox.scrollOffset + insertBox.itemSize,
                    alignOffset: newEmptyOffsetStart,
                    alignSize: newEmptyOffsetEnd - newEmptyOffsetStart
                });
            }

            return newList.sort((a, b) => {
                return a.scrollOffset - b.scrollOffset;
            });
        }
    }
};
</script>
