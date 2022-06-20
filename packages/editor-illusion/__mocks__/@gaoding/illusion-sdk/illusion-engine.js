import { EngineStatus } from '@gaoding/illusion-sdk/lib/enums/engine-status';
import { FilterType } from '@gaoding/illusion-sdk/lib/enums/filter-type';
import { MixerType } from '@gaoding/illusion-sdk/lib/enums/mixer-type';
import { ParserType } from '@gaoding/illusion-sdk/lib/enums/parser-type';
import { defaultOptions } from '@gaoding/illusion-sdk/lib/options';
import { merge } from 'lodash';
import { randomNumber } from '../../random';
import { MockFilter } from './model/filter';
import { MockFrameBuffer } from './model/frame-buffer';
import { MockLayer } from './model/layer';
import { MockMixer } from './model/mixer';
import { MockSource } from './model/source';
import { MockTarget } from './model/target';


class MockIllusionEngine {
    get status() {
        return this.$status;
    }
    get preloaded() {
        return Promise.resolve();
    }

    constructor(servicer, options) {
        this.options = merge({}, defaultOptions, options);
        this.$status = EngineStatus.Shutdown;
        this.layers = [];
        this.target = undefined;
    }

    init = jest.fn(() => {
        this.$status = EngineStatus.Stop;
        return Promise.resolve();
    });

    prepare = jest.fn(() => {
        this.$status = EngineStatus.Running;
        return Promise.resolve();
    });

    submit = jest.fn(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        return Promise.resolve(canvas);
    });

    stop = jest.fn(() => {
        this.$status = EngineStatus.Stop;
        return Promise.resolve();
    });

    shutdown = jest.fn(() => {
        this.$status = EngineStatus.Shutdown;
        return Promise.resolve();
    });

    setTarget = jest.fn((target) => {
        this.target = target;
        return Promise.resolve();
    });

    registerOffscreenCanvas = jest.fn(() => Promise.resolve());
    createSource = jest.fn(() => Promise.resolve(new MockSource()));
    createFrameBuffer = jest.fn((width, height) => Promise.resolve(new MockFrameBuffer(width, height)));
    createTarget = jest.fn((canvasId, width, height) => Promise.resolve(new MockTarget(width, height)));
    createFilterByType = jest.fn((filterType) => Promise.resolve(new MockFilter(filterType)));
    createFilterByShader = jest.fn((name, vs, fs, filterType) => {
        const mockFilter = new MockFilter(filterType);
        mockFilter._name = name;
        mockFilter._vertexShaderPath = vs;
        mockFilter._fragmentShaderPath = fs;
        return Promise.resolve(mockFilter);
    });

    writeFilterShaders = jest.fn();
    writeZip = jest.fn();
    createFiltersByConfig = jest.fn((config, type) => {
        if(type === ParserType.Filter) {
            const keys = Object.keys(FilterType);
            const index = randomNumber(0, keys.length, Math.floor);
            const type = FilterType[keys[index]];
            return Promise.resolve(new MockFilter(type));
        }
        else {
            const keys = Object.keys(MixerType);
            const index = randomNumber(0, keys.length, Math.floor);
            const type = MixerType[keys[index]];
            return Promise.resolve(new MockMixer(type));
        }
    });

    createFiltersByZip = jest.fn(() => {
        return Promise.resolve({
            filters: [new MockFilter(FilterType.BLACK_IN)],
            config: {}
        });
    });

    createMixerByType = jest.fn((type) => Promise.resolve(new MockMixer(type)));

    createLayer = jest.fn(() => Promise.resolve(new MockLayer()));

    addLayer = jest.fn((layer) => {
        if(!this.layers.includes(layer)) {
            this.layers.push(layer);
        }
        return Promise.resolve();
    })

    removeLayer = jest.fn((layer) => {
        const index = this.layers.indexOf(layer);
        if(index >= 0) {
            this.layers.splice(index, 1);
        }
        return Promise.resolve();
    })

    on = jest.fn()
    once = jest.fn()
    off = jest.fn()

    clear = jest.fn((gcAll) => {
        if(gcAll) {
            this.layers = [];
        }
        return Promise.resolve();
    })

    destory = jest.fn();
    synchronize = jest.fn((handler) => {
        const promise = Promise.resolve().then(async() => {
            const result = await handler();
            return result;
        });
        return {
            promise: promise,
            abort: Promise.resolve()
        };
    });

    batch = jest.fn((handler) => {
        return handler();
    });

    exportConfig = jest.fn(() => []);

    exportZip = jest.fn();

    importZip = jest.fn(async(arrayBuffer) => {
        const layer1 = new MockLayer();
        const source = new MockSource();

        layer1.source = arrayBuffer.byteLength > 5 ? source : null;
        layer1.filters = [
            new MockFilter(FilterType.BLACK_IN),
            new MockFilter(FilterType.FADE),
        ];
        layer1.mixer = arrayBuffer.byteLength > 5 ? new MockMixer(MixerType.COLOR) : null;

        const layer2 = new MockLayer();
        layer2.source = new MockSource();
        layer2.mixer = null;

        const layer3 = new MockLayer();
        layer3.mixer = new MockMixer();
        return Promise.resolve({ layers: [layer1, layer2, layer3], configs: [] });
    });

    setBackgroundColor = jest.fn(() => Promise.resolve());
}

export const IllusionEngine = jest.fn().mockImplementation((servicer, options) => new MockIllusionEngine(servicer, options));
