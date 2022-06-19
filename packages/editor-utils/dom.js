/**
 * utils/dom
 */

import $ from './zepto';

export default {
    contains(elA, elB) {
        if (!elA || !elB) {
            return false;
        }

        if (elA instanceof $) {
            elA = elA[0];
        }
        if (elB instanceof $) {
            elB = elB[0];
        }

        if (elA === elB || $.contains(elA, elB)) {
            return true;
        }

        return false;
    },
    isContentEditable(element) {
        let parent = element;
        while (parent) {
            const editable = parent.contentEditable + '';
            if (editable === 'true') {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    },
    isEditable(element) {
        const nodeName = element.nodeName;
        const rInput = /(?:input|textarea)/i;

        if (this.isContentEditable(element) || rInput.test(nodeName)) {
            return true;
        }

        return false;
    },
};
