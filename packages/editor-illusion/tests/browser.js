import { JSDOM, VirtualConsole } from 'jsdom';

const virtualConsole = new VirtualConsole();
virtualConsole.on('error', () => {});
virtualConsole.on('warn', () => {});
virtualConsole.on('info', () => {});
virtualConsole.on('dir', () => {});

const dom = new JSDOM('', {
    resources: 'usable',
    virtualConsole,
});
global.document = dom.window.document;
global.window = dom.window;
global.Image = dom.window.Image;

global.HTMLCanvasElement.prototype.getContext = jest.fn(() => {
    return {
        drawImage: jest.fn(),
        globalAlpha: 0,
        save: jest.fn(),
        restore: jest.fn(),
        clearRect: jest.fn(),
    };
});

class MockImageBitmap {}

global.OffscreenCanvas = jest.fn().mockImplementation((width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.transferToImageBitmap = jest.fn(() => new MockImageBitmap());
    return canvas;
});
