import { Target } from '@gaoding/illusion-sdk/lib/model/target';

export class MockTarget {
    destory = jest.fn(() => Promise.resolve());

    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.offscreen = false;
    }

    setSize = jest.fn((width, height) => {
        this.width = width;
        this.height = height;
        return Promise.resolve();
    })

    setOffscreen = jest.fn((offscreen, needTransform) => {
        this.offscreen = offscreen;
        return Promise.resolve();
    })

    toJson() {
        throw new Error('Method not implemented.');
    }

    get id() {
        return 'testTargeId';
    }
}
