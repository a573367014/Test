import Promise from 'bluebird';
import { isFireFox } from './ua';

// firefox 没有宽高时，imageLoader 宽高会为 0 导致异常
const readSvgXml = (xml) => {
    const div = document.createElement('div');
    div.style.cssText = 'max-width: 500px; position: absolute; top: -10000px; left: -100000px';
    div.innerHTML = xml;
    document.body.appendChild(div);

    const svg = div.querySelector('svg');
    const { width, height } = svg.getBBox();
    if (!svg.getAttribute('width') && width && height) {
        svg.setAttribute('width', Math.round(width) + 'px');
        svg.setAttribute('height', Math.round(height) + 'px');
    }

    xml = div.innerHTML;
    document.body.removeChild(div);

    return xml;
};

const readFile = (file, dataType = 'DataURL') => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const fnName = `readAs${dataType}`;

        if (!reader[fnName]) {
            throw new Error('File read error, dataType not support');
        }

        reader.onerror = () => {
            reject(new Error('File read error'));
        };

        reader.onload = () => {
            try {
                if (isFireFox() && file.type.includes('svg') && dataType === 'Text') {
                    resolve(readSvgXml(reader.result));
                    return;
                }
            } catch (e) {}

            resolve(reader.result);
        };

        reader[fnName](file);
    });
};

export { readSvgXml };
export default readFile;
