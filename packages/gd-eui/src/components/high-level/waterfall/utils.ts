export function on(
    elem: HTMLElement | (Window & typeof globalThis),
    type: string,
    listener: any,
    useCapture = false,
) {
    elem.addEventListener(type, listener, useCapture);
}

export function off(
    elem: HTMLElement | (Window & typeof globalThis),
    type: string,
    listener: any,
    useCapture = false,
) {
    elem.removeEventListener(type, listener, useCapture);
}
