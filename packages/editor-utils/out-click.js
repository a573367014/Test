/**
 * utils/out-click
 */

import $ from './zepto';
import { assign, forEachRight, noop } from 'lodash';

import dom from './dom';

const doc = $(document);

const queue = [];
const outClick = {
    queue: queue,
    add(options) {
        options = assign(
            {
                callback: noop,
                delay: true,
                element: null,
            },
            options,
        );

        if (!options.element) {
            throw new Error('No options.element');
        }

        let removed = false;

        if (options.delay) {
            setTimeout(() => {
                if (!removed) {
                    queue.push(options);
                }
            }, +options.delay || 16);
        } else {
            queue.push(options);
        }

        // evt
        outClick.initEvent();

        return function () {
            outClick.remove(options);
            removed = true;
        };
    },
    remove(options) {
        const inx = queue.lastIndexOf(options);
        if (inx > -1) {
            queue.splice(inx, 1);
        }

        if (!queue.length) {
            outClick.resetEvent();
        }
    },
    checkTask(task, e) {
        const element = task.element;
        if (dom.contains(element, e.target)) {
            return;
        }

        task.callback(e);
    },
    check(e) {
        forEachRight(queue, (task) => {
            outClick.checkTask(task, e);
        });
    },
    initEvent() {
        if (outClick.bound) {
            return;
        }
        outClick.bound = true;

        doc.on('click.editor-out-click', outClick.check);
    },
    resetEvent() {
        if (outClick.bound) {
            doc.off('click.editor-out-click');

            outClick.bound = false;
        }
    },
};

export default {
    outClick: outClick,
    addOutClick(options) {
        return outClick.add(options);
    },
};
