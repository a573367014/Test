import { IllusionEngine } from './illusion-engine';

export const installIllusionEngine = jest.fn((options) => {
    return Promise.resolve().then(() => {
        return new IllusionEngine({}, options);
    });
});
