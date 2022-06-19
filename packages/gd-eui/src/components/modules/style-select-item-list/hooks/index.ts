import { computed, Ref } from '@vue/composition-api';
import { ISegmentItem, IStyleSelectItem } from '../../../../types/style-select-item-list';

export interface IColItem {
    index: number;
    margin: number;
    size: number;
    rowIndex: number;
    data: IStyleSelectItem;
}

export interface ISegmentRowListItem {
    title: string;
    key?: string;
    rowList: IColItem[][];
}
export const useSegmentList = (
    containerWidth: Ref<number>,
    itemSize: Ref<number>,
    list: Ref<ISegmentItem[] | IStyleSelectItem[]>,
) => {
    const minMargin = 14;
    /**
     * 计算每行列数
     */
    const getColCount = () => {
        const count = Math.floor((containerWidth.value - minMargin) / itemSize.value);
        return count < 0 ? 1 : count;
    };

    /**
     * 计算item之间的间距
     */
    const itemMargin = computed(() => {
        const count = getColCount();
        if (count === 1 || count === 0) {
            return 0;
        }
        const margin = (containerWidth.value - count * itemSize.value) / (count - 1);
        return margin < 0 ? 0 : margin;
    });

    /**
     * 是否是IStyleSelectItem类型
     */
    const isIStyleSelectItem = (item: IStyleSelectItem | ISegmentItem) => {
        return (item as IStyleSelectItem).src && typeof (item as IStyleSelectItem).src === 'string';
    };

    /**
     * 获取单个分段的列数据
     */
    const getSegmentRowList = (list: IStyleSelectItem[]) => {
        const colCount = getColCount();
        const margin = itemMargin.value;
        const rowList: IColItem[][] = [];
        let start = -1;
        list.forEach((item: IStyleSelectItem | ISegmentItem, index: number) => {
            if (index % colCount === 0) {
                start++;
                const colList = [
                    {
                        index,
                        margin: 0,
                        size: itemSize.value,
                        rowIndex: start,
                        data: item as IStyleSelectItem,
                    },
                ];
                rowList.push(colList);
            } else {
                rowList[start].push({
                    index,
                    margin,
                    size: itemSize.value,
                    rowIndex: start,
                    data: item as IStyleSelectItem,
                });
            }
        });
        return rowList;
    };

    const segmentList = computed(() => {
        if (list.value.length === 0 || containerWidth.value === 0) {
            return [];
        }
        // IStyleSelectItem 类型list
        if (isIStyleSelectItem(list.value[0])) {
            const rowList = getSegmentRowList(list.value as IStyleSelectItem[]);
            return [
                {
                    title: null,
                    key: 1,
                    rowList,
                },
            ];
        }
        const newList: ISegmentRowListItem[] = [];
        list.value.forEach((segmentItem: ISegmentItem | IStyleSelectItem) => {
            newList.push({
                title: (segmentItem as ISegmentItem).title,
                key: (segmentItem as ISegmentItem).key,
                rowList: getSegmentRowList((segmentItem as ISegmentItem).segment!),
            });
        });
        return newList;
    });

    return {
        segmentList,
    };
};
