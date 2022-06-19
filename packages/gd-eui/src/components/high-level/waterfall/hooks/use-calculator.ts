import { IOptions, IProps, MetaList } from '../../../../types/waterfall';

/**
 * 根据横竖的设置返回不同策略
 * @returns 策略方法
 */
export function useCalculator() {
    function calculate(containerWidth: number, props: IProps, metas: MetaList) {
        const options = getOptions(props);
        const processor = options.line === 'h' ? horizontalLineProcessor : verticalLineProcessor;
        return processor.calculate(containerWidth, options, metas);
    }
    const verticalLineProcessor = (() => {
        /**
         * 垂直场景下的计算方法
         * @param containerWidth 容器宽度
         * @param options 选项配置
         * @param metas metas参数
         * @returns 计算好的坐标值和容器的高度
         */
        function calculate(containerWidth: number, options: IOptions, metas: MetaList) {
            const flex = options.flex;
            const strategy = flex
                ? getRowStrategyWithFlex(containerWidth, flex)
                : getRowStrategy(containerWidth, options);
            const tops = getArrayFillWith(0, strategy.count);
            const rects = metas.map((meta) => {
                //
                const offset = tops.reduce((last, top, i) => (top < tops[last] ? i : last), 0);
                const width = strategy.width[offset % strategy.count];
                const rect = {
                    top: tops[offset],
                    left: strategy.left + (offset ? sum(strategy.width.slice(0, offset)) : 0),
                    width,
                    height: meta.height * (options.fixedHeight ? 1 : width / meta.width),
                };

                // 根据offset和宽度配置来判断宽度，这个算法可以

                // 这里是动态变化的，根据上一个值的高度来判断的
                tops[offset] = tops[offset] + rect.height;
                return rect;
            });
            return {
                calculatedRects: rects,
                height: Math.max.apply(null, tops) + 'px',
            };
        }

        /**
         *  根据策略获取行的渲染配置
         *  @param containerWidth 容器宽度
         *  @param options 整体设置
         *  @returns 策略配置
         */
        function getRowStrategy(containerWidth: number, options: IOptions) {
            let count = containerWidth / options.lineGap;
            let itemWidth;

            if (options.singleMaxWidth >= containerWidth) {
                count = 1;
                itemWidth = Math.max(containerWidth, options.minLineGap);
            } else {
                const maxContentWidth = options.maxLineGap * ~~count;
                const minGreedyContentWidth = options.minLineGap * ~~(count + 1);
                const canFit = maxContentWidth >= containerWidth;
                const canFitGreedy = minGreedyContentWidth <= containerWidth;

                if (canFit && canFitGreedy) {
                    count = Math.round(count);
                    itemWidth = containerWidth / count;
                } else if (canFit) {
                    count = ~~count;
                    itemWidth = containerWidth / count;
                } else if (canFitGreedy) {
                    count = ~~(count + 1);
                    itemWidth = containerWidth / count;
                } else {
                    count = ~~count;
                    itemWidth = options.maxLineGap;
                }
                if (count === 1) {
                    itemWidth = Math.min(containerWidth, options.singleMaxWidth);
                    itemWidth = Math.max(itemWidth, options.minLineGap);
                }
            }
            return {
                width: getArrayFillWith(itemWidth, count),
                count: count,
                left: getLeft(containerWidth, itemWidth * count, options.align),
            };
        }

        /**
         *  flex的情况下直接根据比值来计算宽度
         *  @param containerWidth 容器宽度
         *  @param flex flex的配置
         *  @returns 策略配置
         */
        function getRowStrategyWithFlex(containerWidth: number, flex: IOptions['flex']) {
            const total = sum(flex!);
            return {
                // 根据比值得出每个元素的宽
                width: flex!.map((val) => (containerWidth * val) / total),
                count: flex!.length,
                left: 0,
            };
        }

        return {
            calculate,
        };
    })();

    const horizontalLineProcessor = (() => {
        /**
         * 水平场景下的计算方法
         * @param containerWidth 容器宽度
         * @param options 选项配置
         * @param metas metas参数
         * @returns 计算好的坐标值和容器的高度
         */
        function calculate(containerWidth: number, options: IOptions, metas: MetaList) {
            const total = metas.length;
            let top = 0;
            let offset = 0;
            const rects = [];
            while (offset < total) {
                const strategy = getRowStrategy(containerWidth, options, metas, offset);
                for (let i = 0, left = 0, meta; i < strategy.count; i++) {
                    meta = metas[offset + i];
                    const rect = {
                        top,
                        left: strategy.left + left,
                        width: (meta.width * strategy.height) / meta.height,
                        height: strategy.height,
                    };
                    rects[offset + i] = rect;
                    left += rect.width;
                }
                offset += strategy.count;
                top += strategy.height;
            }
            return {
                calculatedRects: rects,
                height: top + 'px',
            };
        }

        /**
         * 横向场景下的行策略
         * @param containerWidth 容器宽度
         * @param options 选项配置
         * @param metas metas参数
         * @param offset 当前的偏移量
         * @returns 横向策略配置
         */
        function getRowStrategy(
            containerWidth: number,
            options: IOptions,
            metas: MetaList,
            offset: number,
        ) {
            const greedyCount = getGreedyCount(containerWidth, options.lineGap, metas, offset);
            const lazyCount = Math.max(greedyCount - 1, 1);
            const greedySize = getContentSize(containerWidth, options, metas, offset, greedyCount);
            const lazySize = getContentSize(containerWidth, options, metas, offset, lazyCount);

            const finalSize = chooseFinalSize(lazySize, greedySize, containerWidth);
            let height = finalSize.height;
            let fitContentWidth = finalSize.width;
            if (finalSize.count === 1) {
                fitContentWidth = Math.min(options.singleMaxWidth, containerWidth);
                height = (metas[offset].height * fitContentWidth) / metas[offset].width;
            }
            return {
                left: getLeft(containerWidth, fitContentWidth, options.align),
                count: finalSize.count,
                height: height,
            };
        }

        /**
         * @param containerWidth 容器宽度
         * @param options 选项配置
         * @param metas metas参数
         * @param offset 当前的偏移量
         * @returns 每一行的个数
         */
        function getGreedyCount(
            containerWidth: number,
            rowHeight: number,
            metas: MetaList,
            offset: number,
        ) {
            let count = 0;
            // 两个条件，小于metas的长度，并且width要小于容器宽度
            // offset是传进来的第几个值
            for (let i = offset, width = 0; i < metas.length && width <= containerWidth; i++) {
                width += (metas[i].width * rowHeight) / metas[i].height;
                count++;
            }
            return count;
        }

        /**
         * 根据配置得出内容的宽度
         * @param containerWidth 容器宽度
         * @param options 选项配置
         * @param metas metas参数
         * @param offset 当前的偏移量
         * @returns 每一行的个数
         */
        function getContentSize(
            containerWidth: number,
            options: IOptions,
            metas: MetaList,
            offset: number,
            count: number,
        ) {
            let originWidth = 0;
            // count在贪心的情况下多一个，lazy的时候少一个
            for (let i = count - 1; i >= 0; i--) {
                const meta = metas[offset + i];
                originWidth += (meta.width * options.lineGap) / meta.height;
            }
            const fitHeight = (options.lineGap * containerWidth) / originWidth;
            const canFit = fitHeight <= options.maxLineGap && fitHeight >= options.minLineGap;
            if (canFit) {
                return {
                    cost: Math.abs(options.lineGap - fitHeight),
                    count: count,
                    width: containerWidth,
                    height: fitHeight,
                };
            } else {
                const height =
                    originWidth > containerWidth ? options.minLineGap : options.maxLineGap;
                return {
                    cost: Infinity,
                    count: count,
                    width: (originWidth * height) / options.lineGap,
                    height: height,
                };
            }
        }

        type IContentSize = ReturnType<typeof getContentSize>;

        /**
         * 根据内容宽度和容器宽度的匹配程度选取最为合适的策略
         * @param lazySize 懒策略配置
         * @param greedySize 贪心策略配置
         * @param containerWidth 容器宽度
         * @returns 被选中的策略
         */
        function chooseFinalSize(
            lazySize: IContentSize,
            greedySize: IContentSize,
            containerWidth: number,
        ) {
            // 如果两个都是infinity？两个都不合适
            if (lazySize.cost === Infinity && greedySize.cost === Infinity) {
                return greedySize.width < containerWidth ? greedySize : lazySize;
            } else {
                return greedySize.cost >= lazySize.cost ? lazySize : greedySize;
            }
        }

        return {
            calculate,
        };
    })();

    /**
     * @param props waterfall组件的props
     * @returns 处理后的参数配置
     */
    function getOptions(props: IProps) {
        const maxLineGap = props.maxLineGap || props.lineGap;
        return {
            align: props.align,
            line: props.line,
            lineGap: props.lineGap,
            maxLineGap,
            minLineGap: props.minLineGap || props.lineGap,
            singleMaxWidth: Math.max(props.singleMaxWidth || 0, maxLineGap),
            fixedHeight: props.fixedHeight,
            flex: props.flex,
        };
    }

    /**
     * @param containerWidth 容器宽度
     * @param contentWidth 内容宽度
     * @param align 对齐配置
     * @returns left值
     */
    function getLeft(containerWidth: number, contentWidth: number, align?: string) {
        switch (align) {
            case 'right':
                return containerWidth - contentWidth;
            case 'center':
                return (containerWidth - contentWidth) / 2;
            default:
                return 0;
        }
    }

    function sum(arr: number[]) {
        return arr.reduce((sum, val) => sum + val);
    }

    /**
     *
     */
    function getArrayFillWith(item: any, count: number): any[] {
        return Array.from({ length: count }).fill(item);
    }

    return {
        calculate,
    };
}
