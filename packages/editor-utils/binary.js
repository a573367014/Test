const dataURLPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;
const blobURLPattern = /^blob:/;

export function dataurlToBlob(dataURL) {
    // Parse the dataURL components as per RFC 2397
    const matches = dataURL.match(dataURLPattern);
    if (!matches) {
        throw new Error('invalid data URI');
    }

    // Default to text/plain;charset=US-ASCII
    const mediaType = matches[2] ? matches[1] : 'text/plain' + (matches[3] || ';charset=US-ASCII');
    const isBase64 = !!matches[4];
    const dataString = dataURL.slice(matches[0].length);

    const byteString = isBase64
        ? // Convert base64 to raw binary data held in a string:
          atob(dataString)
        : // Convert base64/URLEncoded data component to raw binary:
          decodeURIComponent(dataString);

    // Write the bytes of the string to an ArrayBuffer:
    const byteStringLen = byteString.length;
    const arrayBuffer = new ArrayBuffer(byteStringLen);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteStringLen; i += 1) {
        intArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([intArray], {
        type: mediaType,
    });
}

export async function bloburlToBlob(blobURL) {
    const matches = blobURL.match(blobURLPattern);
    if (!matches) {
        throw new Error('invalid blob URI');
    }

    const result = await fetch(blobURL);
    return result.blob();
}

export function isDataUrl(url) {
    const isBase64 = url && url.includes(';base64');
    return isBase64;
}

export function isBlobUrl(url) {
    const isBlob = url && url.includes('blob:');
    return isBlob;
}

export function canvasToBlob(canvas) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob));
    });
}

export default {
    isDataUrl,
    isBlobUrl,
    dataurlToBlob,
    bloburlToBlob,
};
