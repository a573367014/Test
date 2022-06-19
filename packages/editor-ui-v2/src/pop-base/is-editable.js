const rInput = /(?:input|button|textarea)/i;

const isEditable = elem => {
    const nodeName = elem && elem.nodeName;

    if(!nodeName) {
        return false;
    }

    if(
        rInput.test(nodeName) ||
        String(elem.contentEditable) === 'true'
    ) {
        return true;
    }

    return false;
};

export default isEditable;
