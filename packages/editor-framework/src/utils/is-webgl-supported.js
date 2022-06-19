function detectWebgl() {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl'));
}

export const isWebglSupported = detectWebgl();
