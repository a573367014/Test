import { randomNumber } from '../../../random';
import { MockParam } from './param';


export class MockFilter {
    constructor(type) {
        this._type = type;
        this._name = 'testFilterName';
        this._params = {
            'test': new MockParam()
        };
        this._vertexShaderPath = 'testVertexShaderPath';
        this._fragmentShaderPath = 'testFragmentShaderPath';
    }

    get type() {
        return this._type;
    }
    get name() {
        return this._name;
    }
    get params() {
        return this._params;
    }
    get vertexShaderPath() {
        return this._vertexShaderPath;
    }
    get fragmentShaderPath() {
        return this._fragmentShaderPath;
    }
    get index() {
        return `${randomNumber(0, 10, Math.round)}`;
    }
    get version() {
        return '0.0.1';
    }
    get input2() {
        return '';
    }
    destory = jest.fn(() => Promise.resolve());

    syncParams = jest.fn(() => {
        return Promise.resolve(this._params);
    });

    updateParamValue = jest.fn((name, value) => {
        if(!Array.isArray(value)) {
            value = [value];
        }
        if(this._params[name]) {
            this._params[name].array = value;
        }
        return Promise.resolve();
    });

    updateValue1 = jest.fn();
    updateValue2 = jest.fn();
    updateValue3 = jest.fn();
    updateValue4 = jest.fn();

    toJson() {
        throw new Error('Method not implemented.');
    }
    get id() {
        return 'testFilterId';
    }
}
