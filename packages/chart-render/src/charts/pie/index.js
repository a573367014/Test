import BasePie from '../../base/base-pie/base-pie';

/**
 * @class Pie
 */
export default class Pie extends BasePie {
    static chartType = 'pie';

    getDefaultModel() {
        return {
            settings: {
                startAngle: 90,
                allAngle: 360,
                coordRadius: 1,
            },
            label: {
                offset: -0.5,
            },
            yAxis: {
                startRange: 0, // 从哪里开始
                endRange: 1, // 从哪里结束
            },
        };
    }
}
