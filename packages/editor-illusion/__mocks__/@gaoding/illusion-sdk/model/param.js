import { ParamType } from '@gaoding/illusion-sdk/lib/enums/param-type';
import { randomNumber } from '../../../random';


export class MockParam {
    constructor() {
        this.name = 'testParam';
        this.type = ParamType.FLOAT;
        this.array = [randomNumber(0, 10)];
        this.min = [0];
        this.max = [10];
        this.count = 1;
        this.dimension = 1;
    }
}
