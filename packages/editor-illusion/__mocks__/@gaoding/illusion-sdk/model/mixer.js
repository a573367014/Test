import { MockParam } from './param';

export class MockMixer {
    constructor(type) {
        this._type = type;
        this._name = 'testMixerName';
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
        return this.params;
    }
    get index() {
        return 'testMixerIndex';
    }
    get vertexShaderPath() {
        return this._vertexShaderPath;
    }
    get fragmentShaderPath() {
        return this._fragmentShaderPath;
    }
    get version() {
        return '0.1.0';
    }
    destory = jest.fn();
    syncParams = jest.fn(() => Promise.resolve(this._params));
    updateParamValue(name, value) {
        if(!Array.isArray(value)) {
            value = [value];
        }
        if(this._params[name]) {
            this._params[name].array = value;
        }
        return Promise.resolve();
    }
    toJson() {
        throw new Error('Method not implemented.');
    }
    get id() {
        return 'testMixerId';
    }
}
