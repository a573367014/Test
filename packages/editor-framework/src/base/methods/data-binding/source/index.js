import { OpenAPI } from './adaptor';

const adaptors = [new OpenAPI()];

const externalAdaptors = [];

export function findMatchedAdaptor(def) {
    return externalAdaptors
        .slice()
        .concat(adaptors)
        .filter((a) => a.match(def))[0];
}

export function registerAdaptor(a) {
    if (externalAdaptors.indexOf(a) === -1) {
        externalAdaptors.push(a);
    }
}
