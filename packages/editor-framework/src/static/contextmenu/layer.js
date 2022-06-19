export const getItemsMeta = (items = [], affectedItems = [], groupedItems = []) => {
    if (items.length === 0 || affectedItems.length === 0) {
        return {
            length: 0,
            index: 0,
        };
    }

    const subItems = items.filter((item) => affectedItems.includes(item));
    const firstGrouped = groupedItems[0];
    return {
        length: subItems.length - (groupedItems.length - 1),
        index: subItems.indexOf(firstGrouped),
    };
};

export const batchAdjust = (items = [], groupedItems = [], offset = 0) => {
    if (offset === 0) {
        return items;
    }

    let upperBound, lowerBound;
    if (offset > 0) {
        const lastGrouped = groupedItems[groupedItems.length - 1];
        upperBound = Math.min(items.length - 1, items.indexOf(lastGrouped) + offset);
        lowerBound = upperBound - (groupedItems.length - 1);
    } else {
        const firstGrouped = groupedItems[0];
        lowerBound = Math.max(0, items.indexOf(firstGrouped) + offset);
        upperBound = lowerBound + (groupedItems.length - 1);
    }

    const ungroupedItems = items.filter((item) => !groupedItems.includes(item));
    const results = [];
    let [i, j] = [0, 0];
    while (results.length < items.length) {
        if (lowerBound <= results.length && results.length <= upperBound) {
            results.push(groupedItems[i]);
            i++;
        } else {
            results.push(ungroupedItems[j]);
            j++;
        }
    }

    return results;
};

export default {
    data() {
        return {
            segments: 0,
            currLayer: null,
        };
    },
    computed: {
        selectedElementsLength() {
            return this.editor.selectedElements && this.editor.selectedElements.length;
        },
        multiSelected() {
            return this.selectedElementsLength > 1;
        },
    },
    watch: {
        currLayer(newIndex, oldIndex) {
            if (oldIndex === null) {
                return;
            }

            if (this.multiSelected) {
                const { currentLayout, selectedElements } = this.editor;
                const adjustedElements = batchAdjust(
                    currentLayout.elements,
                    selectedElements,
                    newIndex - oldIndex,
                );
                currentLayout.elements = adjustedElements;
                this.editor.makeSnapshot('adjust_multi_layers');
            } else {
                const { currentElement, currentLayout, getOverlapElements } = this.editor;
                const overlapElements = getOverlapElements();
                const elementBelow = overlapElements[newIndex];

                const newLayerIndex = currentLayout.elements.indexOf(elementBelow);
                const oldLayerIndex = currentLayout.elements.indexOf(currentElement);
                this.editor.goElementIndex(currentElement, newLayerIndex - oldLayerIndex);
            }
        },
        'menu.isShow'(value) {
            if (value && this.currentElement) {
                this.init();
            }
        },
    },
    methods: {
        init() {
            const { currentLayout, selectedElements } = this.editor;

            // 区分多选与单选更新
            if (this.multiSelected) {
                const { elements } = currentLayout;
                const { length, index } = getItemsMeta(elements, elements, selectedElements);
                // n 个节点之间存在 n - 1 个 segment
                this.segments = length - 1;
                this.currLayer = index;
            } else {
                const { currentElement, getOverlapElements } = this.editor;
                const overlapElements = getOverlapElements();
                this.segments = Math.max(overlapElements.length - 1, 0);
                this.currLayer = overlapElements.indexOf(currentElement);
            }
        },

        moveUp() {
            this.currLayer = Math.min(this.currLayer + 1, this.segments);
            this.menu.isShow = false;
        },

        moveDown() {
            this.currLayer = Math.max(this.currLayer - 1, 0);
            this.menu.isShow = false;
        },
    },
};
