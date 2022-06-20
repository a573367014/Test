export class MockFrameBuffer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    destory = jest.fn(() => Promise.resolve())
    setTexture = jest.fn((frameSource) => {
        this.width = frameSource.width;
        this.height = frameSource.height;
        return Promise.resolve();
    });
    toJson() {
        throw new Error('Method not implemented.');
    }
    get id() {
        return 'frameBufferTestId';
    }
}
