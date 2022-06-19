export const getItemsMeta = (
    items = [], affectedItems = [], groupedItems = []
) => {
    if(items.length === 0 || affectedItems.length === 0) {
        return {
            length: 0,
            index: 0
        };
    }

    const subItems = items.filter(item => affectedItems.includes(item));
    const firstGrouped = groupedItems[0];
    return {
        length: subItems.length - (groupedItems.length - 1),
        index: subItems.indexOf(firstGrouped)
    };
};

export const batchAdjust = (items = [], groupedItems = [], offset = 0) => {
    if(offset === 0) {
        return items;
    }

    let upperBound, lowerBound;
    if(offset > 0) {
        const lastGrouped = groupedItems[groupedItems.length - 1];
        upperBound = Math.min(items.length - 1, items.indexOf(lastGrouped) + offset);
        lowerBound = upperBound - (groupedItems.length - 1);
    }
    else {
        const firstGrouped = groupedItems[0];
        lowerBound = Math.max(0, items.indexOf(firstGrouped) + offset);
        upperBound = lowerBound + (groupedItems.length - 1);
    }

    const ungroupedItems = items.filter(item => !groupedItems.includes(item));
    const results = [];
    let [i, j] = [0, 0];
    while(results.length < items.length) {
        if(lowerBound <= results.length && results.length <= upperBound) {
            results.push(groupedItems[i]);
            i++;
        }
        else {
            results.push(ungroupedItems[j]);
            j++;
        }
    }

    return results;
};

// 该实现存在将未参与调节元素顺序置换到一般元素之上的问题，废弃之
export const batchAdjustAffected = (
    items = [], affectedItems = [], groupedItems = [], offset = 0
) => {
    const subItems = items.filter(item => affectedItems.includes(item));
    const affectedIndexes = subItems.map(item => items.indexOf(item));

    const adjustedSubItems = batchAdjust(subItems, groupedItems, offset);
    const results = [...items];
    affectedIndexes.forEach((affectedIndex, subItemIndex) => {
        results[affectedIndex] = adjustedSubItems[subItemIndex];
    });
    return results;
};
