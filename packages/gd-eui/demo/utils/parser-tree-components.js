import { uuid } from './uuid';

export const parserTreeComponents = (component) => {
    const name = component.$options.name;
    const key = uuid();
    const children = [];
    component.$children.forEach((child) => {
        children.push(parserTreeComponents(child));
    });
    return {
        name,
        title: name,
        key,
        children,
        value: {
            name,
            component,
            title: name,
            key,
            children,
        },
    };
};
