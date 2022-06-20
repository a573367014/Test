import { MixerType } from '@gaoding/illusion-sdk/lib/enums/mixer-type';
import { MockMixer } from './mixer';

export class MockLayer {
    constructor() {
        this.filters = [];
        this.mixer = null;
        this.enterAnimation = null;
        this.exitAnimation = null;
        this.source = undefined;
        this.startTime = 0;
        this.duration = 0;
        this.zOrder = 0;
        this.opacity = 1;
        this.intensity = 1;
        this.visible = true;
        this._translate = { x: 0, y: 0, z: 0 };
        this._scale = { x: 1, y: 1, z: 1 };
        this._rotate = { x: 0, y: 0, z: 0 };
    }

    destory = jest.fn();
    setSource = jest.fn((source) => {
        this.source = source;
        return Promise.resolve();
    })
    setTimeRange = jest.fn((startTime, duration) => {
        this.startTime = startTime;
        this.duration = duration;
        return Promise.resolve();
    })
    setZOrder = jest.fn((zOrder) => {
        this.zOrder = zOrder;
        return Promise.resolve();
    })
    setOpacity = jest.fn((opacity) => {
        this.opacity = opacity;
        return Promise.resolve();
    });
    getOpacity = jest.fn(() => Promise.resolve(this.opacity));
    translate = jest.fn((x, y, z) => {
        this._translate = { x, y, z };
        return Promise.resolve();
    })
    getTranslate = jest.fn(() => this._translate);
    scale = jest.fn((x, y, z) => {
        this._scale = { x, y, z };
        return Promise.resolve();
    })
    getScale = jest.fn(() => this._scale)
    rotate = jest.fn((x, y, z) => {
        this._rotate = { x, y, z };
        return Promise.resolve();
    })
    getRotate = jest.fn(() => this._rotate)
    setBlendMode = jest.fn((mode) => {
        // @ts-ignore
        this.mixer = new MockMixer(MixerType.COLOR);
        return Promise.resolve();
    })
    setMixerType = jest.fn((type) => {
        // @ts-ignore
        this.mixer = new MockMixer(type);
        return Promise.resolve();
    })
    setMixer = jest.fn((mixer) => {
        this.mixer = mixer;
        return Promise.resolve();
    })
    updateMixerValue = jest.fn((name, value) => {
        this.mixer?.updateParamValue(name, value);
        return Promise.resolve();
    })
    setEnterAnimation = jest.fn((type) => {
        this.enterAnimation = {
            type: type,
            progress: 0
        };
        return Promise.resolve();
    })
    updateEnterAnimationProgress = jest.fn((progress) => {
        this.enterAnimation.progress = progress;
        return Promise.resolve();
    })
    setExitAnimation = jest.fn((type) => {
        this.exitAnimation = {
            type: type,
            progress: 0
        };
        return Promise.resolve();
    })
    updateExitAnimationProgress = jest.fn((progress) => {
        this.exitAnimation.progress = progress;
        return Promise.resolve();
    })
    insertEffect = jest.fn((filter, index, wrapPixelAround) => {
        this.filters.splice(index, 0, filter);
        return Promise.resolve();
    })
    addEffect = jest.fn((filter, wrapPixelAround) => {
        this.filters.push(filter);
        return Promise.resolve();
    })
    removeEffect = jest.fn((filter) => {
        const index = this.filters.indexOf(filter);
        if(index >= 0) {
            this.filters.splice(index, 1);
        }
        return Promise.resolve();
    })
    clearEffects = jest.fn(() => {
        this.filters = [];
        return Promise.resolve();
    })
    updateEffectIntensity = jest.fn((intensity) => {
        this.intensity = intensity;
        return Promise.resolve();
    });
    setVisibility = jest.fn((visible) => {
        this.visible = visible;
        return Promise.resolve();
    })
    toJson() {
        throw new Error('Method not implemented.');
    }
    get id() {
        return 'testLayerId';
    }

    addMask = jest.fn(() => Promise.resolve());
    removeMask = jest.fn(() => Promise.resolve());
    anchor = jest.fn(() => Promise.resolve());
}
