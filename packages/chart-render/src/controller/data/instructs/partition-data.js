import InstructsBase from './base';

// 将数据按照区间重新划分

export default class PartitionData extends InstructsBase {
    constructor(step) {
        super();
        this.step = step;
    }

    callback(dataSource) {
        /**
         * step:300
         * parmas:
         * [
         *  {value:135},
         *  {value:235},
         *  {value:85},
         *  {value:335},
         *  {value:435}
         * ]
         *
         * return:
         * [
         *  {connt:3,value:[0,300]},
         *  {connt:2,value:[300,600]},
         * ]
         * connt: 区间在0-300的集合
         * value: 区间
         */
        return dataSource;
    }
}
