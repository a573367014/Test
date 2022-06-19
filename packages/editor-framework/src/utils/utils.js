/**
 * utils/utils
 */
import { assign } from 'lodash';

import transformMath from '@gaoding/editor-utils/transform-math';
import string from '@gaoding/editor-utils/string';
import loader from '@gaoding/editor-utils/loader';
import rect from '@gaoding/editor-utils/rect';
import ua from '@gaoding/editor-utils/ua';
import binary from '@gaoding/editor-utils/binary';
import version from '@gaoding/editor-utils/version';
import templet from '@gaoding/editor-utils/templet';

import dom from '@gaoding/editor-utils/dom';
import outClick from '@gaoding/editor-utils/out-click';
import alignment from './alignment';
import serialize from './rich-text/utils/serialize';
import other from './other';

const utils = assign(
    {},
    transformMath,
    outClick,
    string,
    loader,
    rect,
    dom,
    alignment,
    ua,
    binary,
    templet,
    other,
);

export default utils;
export { version, serialize };
