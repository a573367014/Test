import Mockjs from 'mockjs';
import { checkIsColor } from './utils';

export const walkerData = function (data) {
    const obj = {};
    if (data instanceof Array) {
        const list = [];
        data.forEach((item) => {
            const mObj = walkerData(item);
            list.push(mObj);
        });
        // const moreCount = Math.floor(Math.random() * data.length);
        // data.forEach((item, index) => {
        //     if (index > moreCount) {
        //         return;
        //     }
        //     const mObj = walkerData(item);
        //     list.push(mObj);
        // });
        return list;
    } else if (data instanceof Object) {
        Object.keys(data).forEach((key) => {
            obj[key] = walkerData(data[key]);
        });
    } else {
        const Random = Mockjs.Random;
        if (typeof data === 'number') {
            if (data > 0 && data < 1) {
                return Math.random();
            }
            return Random.natural(0, 100);
        } else if (typeof data === 'string') {
            if (data.match(/http|data:image/)) {
                if (data.match(/(.jpg|.png|.webp|data:image)/)) {
                    return Random.dataImage();
                }
                return Random.url('http', 'gd-eui.com');
            } else if (checkIsColor(data)) {
                return Random.color();
            }
            return Random.csentence(3, 10);
        }
        return data;
    }
    return obj;
};
