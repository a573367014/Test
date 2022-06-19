// import $ from '@gaoding/editor-utils/zepto';

export function compatibleEvent(e) {
    return e.touches ? (e.type === 'touchend' ? e.changedTouches[0] : e.touches[0]) : e;
}

const eventMap = {
    mousemove: 'touchmove',
    mousedown: 'touchstart',
    mouseup: 'touchup',
};

export function on(target, eventName, fn) {
    target.on(eventName, fn);
    eventMap[eventName] &&
        target.addEventListener(eventMap[eventName], fn, {
            passive: false,
            capture: true,
        });
}

export function one(target, eventName, fn) {
    target.on(eventName, fn);
    eventMap[eventName] &&
        target.addEventListener(eventMap[eventName], fn, {
            passive: false,
            capture: true,
        });
}

export function off(target, eventName, fn) {
    target.off(eventName, fn);
    eventMap[eventName] && target.removeEventListener(eventMap[eventName], fn);
}
