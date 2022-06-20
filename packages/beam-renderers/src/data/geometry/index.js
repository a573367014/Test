export * from './cube';
export * from './sphere';
export * from './plane';
export * from './cylinder';

export const toWireframe = (index) => {
    const { array = [] } = index;

    const wireframe = new Array(array.length * 2);
    for (let i = 0; i < array.length; i += 3) {
        wireframe[i * 2] = array[i];
        wireframe[i * 2 + 1] = array[i + 1];

        wireframe[i * 2 + 2] = array[i + 1];
        wireframe[i * 2 + 3] = array[i + 2];

        wireframe[i * 2 + 4] = array[i];
        wireframe[i * 2 + 5] = array[i + 2];
    }

    return { array: wireframe };
};
