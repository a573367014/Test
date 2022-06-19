/**
 * vue-inherit
 */

import { cloneDeep } from 'lodash';

const inherit = function (parent, config) {
    let ret = [];

    if (Array.isArray(parent)) {
        ret = ret.concat(cloneDeep(parent));
    } else {
        ret.push(parent);
    }

    ret.push(config);

    return ret;
};

export default inherit;
