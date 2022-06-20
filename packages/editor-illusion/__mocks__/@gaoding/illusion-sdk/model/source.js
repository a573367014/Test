import { FillType } from '@gaoding/illusion-sdk/lib/enums/fill-type';

export class MockSource {
    constructor() {
        this._id = 'testSourceId';
        this.type = 'image';
        this.url = '';
        this.color = '';
        this.linkId = '';
        this._width = 0;
        this._height = 0;
        this._fillType = FillType.NONE;
        this._translate = { x: 0, y: 0, z: 0 };
        this._rotate = { x: 0, y: 0, z: 0 };
        this._scale = { x: 1, y: 1, z: 1 };
    }

    get id() {
        return this._id;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get fillType() {
        return this._fillType;
    }
    destory = jest.fn(() => Promise.resolve());
    setPixels = jest.fn((pixels, width, height) => {
        this.type = 'image';
        this._width = width;
        this._height = height;
        return Promise.resolve();
    });
    setFrameBuffer = jest.fn(() => Promise.resolve());
    setPixelsFromCanvas = jest.fn((canvas) => {
        this.type = 'image';
        this._width = canvas.width;
        this._height = canvas.height;
        return Promise.resolve();
    });
    setPixelsFromImage = jest.fn((image) => {
        this.type = 'image';
        this._width = image.width;
        this._height = image.height;
        return Promise.resolve();
    });
    setPixelsFromUrl = jest.fn((url) => {
        this.url = url;
        return Promise.resolve();
    });
    setPixelsFromColor = jest.fn((color, width, height) => {
        this.color = color;
        this._width = width;
        this._height = height;
        return Promise.resolve();
    });
    setFillType = jest.fn((fillType) => {
        this._fillType = fillType;
        return Promise.resolve();
    });
    setClipSize = jest.fn((width, height) => {
        return Promise.resolve();
    });
    setClipRatio = jest.fn((ratio) => {
        return Promise.resolve();
    });
    translate = jest.fn((x, y, z) => {
        this._translate = { x, y, z };
        return Promise.resolve();
    });
    getTranslate = jest.fn(() => this._translate);
    scale = jest.fn((x, y, z) => {
        this._scale = { x, y, z };
        return Promise.resolve();
    });
    getScale = jest.fn(() => this._scale)
    rotate = jest.fn((x, y, z) => {
        this._rotate = { x, y, z };
        return Promise.resolve();
    });
    getRotate = jest.fn(() => this._rotate);
    notifyRefresh = jest.fn(() => Promise.resolve());
    setCanvasSize = jest.fn((width, height) => {
        return Promise.resolve();
    });
    toJson() {
        throw new Error('Method not implemented.');
    }

    anchor = jest.fn(() => Promise.resolve());
}
