import { hasOwn } from '../util';
import { get } from 'lodash';

export class OpenAPI {
    match(def) {
        return hasOwn(def, 'openapi');
    }

    fetch(def) {
        const requestInit = this.generate(def);
        const request = new Request(requestInit.url, { method: requestInit.method });
        return fetch(request).then((response) => {
            if (response.status === 200) {
                // TODO@YUDAN: 支持其他 content-type
                return response.json();
            } else {
                throw new Error('Something went wrong on api server!');
            }
        });
    }

    /**
     * private
     */
    generate(def) {
        // TODO@YUDAN: 支持更精细的校验
        const paths = Object.keys(def.paths);
        if (!paths.length) {
            console.warn('Incorrect API Defination.');
            return null;
        }

        // 只支持第一项
        const path = paths[0];
        const baseURL = def.servers[0].url;
        return {
            url: `${baseURL}${path}`,
            method: 'GET',
        };
    }

    parse(def, key) {
        const paths = Object.keys(def.paths);

        const path = paths[0];
        const alias = {};

        if (def.alias && key) {
            alias[def.alias] = key;
        }

        let response = get(
            def,
            `paths[${path}].get.responses['200'].content['application/json'].schema`,
        );
        if (response) {
            if (response.$ref) {
                response = get(def, response.$ref.replace('#/', '').replace(/\//gi, '.'));
            }
            if (response.type === 'object') {
                Object.keys(response.properties).forEach((key) => {
                    const prop = response.properties[key];
                    if (prop.alias) {
                        alias[prop.alias] = key;
                    }
                });
            }
        }

        return {
            alias,
        };
    }
}
