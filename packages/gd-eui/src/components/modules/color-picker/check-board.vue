<template>
    <div class="vc-checkerboard" :style="bgStyle"></div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
interface Map<T> {
    [key: string | number]: T;
}
const _checkboardCache: Map<String | null> = {};

export default defineComponent({
    name: 'ge-checkboard',
    props: {
        size: {
            type: Number,
            default: 5,
        },
        white: {
            type: String,
            default: '#fff',
        },
        grey: {
            type: String,
            default: '#e6e6e6',
        },
    },
    setup(props) {
        const bgStyle = computed(() => {
            return {
                'background-size': `${props.size}px ${props.size}px`,
                'background-image':
                    'url(' + getCheckboard(props.white, props.grey, props.size) + ')',
            };
        });
        return {
            bgStyle,
        };
    },
});

/**
 * get base 64 data by canvas
 *
 * @param {String} c1 hex color
 * @param {String} c2 hex color
 * @param {Number} size
 */

function renderCheckboard(c1: string, c2: string, size: number) {
    // Dont Render On Server
    if (typeof document === 'undefined') {
        return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size * 2;
    const ctx = canvas.getContext('2d');
    // If no context can be found, return early.
    if (!ctx) {
        return null;
    }
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = c2;
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size, size);
    ctx.fillRect(0, 0, size, size);
    return canvas.toDataURL();
}

/**
 * get checkboard base data and cache
 *
 * @param {String} c1 hex color
 * @param {String} c2 hex color
 * @param {Number} size
 */

function getCheckboard(c1: string, c2: string, size: number) {
    const key = c1 + ',' + c2 + ',' + size;

    if (_checkboardCache[key]) {
        return _checkboardCache[key];
    } else {
        const checkboard = renderCheckboard(c1, c2, size);
        _checkboardCache[key] = checkboard;
        return checkboard;
    }
}
</script>
