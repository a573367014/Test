import Promise from 'bluebird';

const slice = Array.prototype.slice;

const pickFile = ({ multiple = false, accept = '*/*' } = {}) => {
    const doc = document;
    const body = doc.body || doc.documentElement;

    return new Promise((resolve) => {
        const input = doc.createElement('input');
        const clearInput = () => {
            body.removeEventListener('mousedown', clearInput, false);

            body.removeChild(input);

            input.onchange = null;
        };

        multiple && input.setAttribute('multiple', multiple);
        input.setAttribute('type', 'file');
        input.setAttribute('accept', accept);
        input.style.cssText = 'position:absolute;top:-199px;height:0;opacity:0';

        input.onchange = () => {
            const files = slice.call(input.files);
            if (!files[0]) {
                return;
            }

            resolve(multiple ? files : files[0]);
        };

        body.appendChild(input);

        input.click();

        // remove input element after close dialog
        body.addEventListener('mousedown', clearInput, false);
    });
};

export default pickFile;
