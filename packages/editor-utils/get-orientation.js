/**
 * @author pingzi
 * https://github.com/exif-js/exif-js/blob/master/exif.js
 * 将读取出来的 Orientation 复写为 1
 */

function getStringFromDB(buffer, start, length) {
    let outstr = '';
    for (let n = start; n < start + length; n++) {
        outstr += String.fromCharCode(buffer.getUint8(n));
    }
    return outstr;
}

function findEXIFinJPEG(file) {
    const dataView = new DataView(file);

    if (dataView.getUint16(0) !== 0xffd8) {
        return false; // not a valid jpeg
    }

    let offset = 2;
    const length = file.byteLength;
    let marker = null;

    while (offset < length) {
        if (dataView.getUint8(offset) !== 0xff) {
            return false; // not a valid marker, something is wrong
        }

        marker = dataView.getUint16(offset);

        if (marker === 0xffe1) {
            return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);
        } else {
            offset += 2 + dataView.getUint16(offset + 2);
        }
    }
}

function readEXIFData(file, start) {
    if (getStringFromDB(file, start, 4) !== 'Exif') {
        console.log('Not valid EXIF data! ' + getStringFromDB(file, start, 4));
        return false;
    }

    let bigEnd = null;
    const tiffOffset = start + 6;

    if (file.getUint16(tiffOffset) === 0x4949) {
        bigEnd = false;
    } else if (file.getUint16(tiffOffset) === 0x4d4d) {
        bigEnd = true;
    } else {
        console.log('Not valid TIFF data! (no 0x4949 or 0x4D4D)');
        return false;
    }

    if (file.getUint16(tiffOffset + 2, !bigEnd) !== 0x002a) {
        console.log('Not valid TIFF data! (no 0x002A)');
        return false;
    }

    const firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);

    if (firstIFDOffset < 0x00000008) {
        console.log(
            'Not valid TIFF data! (First offset less than 8)',
            file.getUint32(tiffOffset + 4, !bigEnd),
        );
        return false;
    }

    const tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, bigEnd);

    return tags;
}

function readTags(file, tiffStart, dirStart, bigEnd) {
    const entries = file.getUint16(dirStart, !bigEnd);
    const tags = {};

    for (let i = 0; i < entries; i++) {
        const entryOffset = dirStart + i * 12 + 2;

        if (file.getUint16(entryOffset, !bigEnd) === 0x0112) {
            const tag = 'Orientation';
            tags[tag] = {
                value: file.getUint16(entryOffset + 8, !bigEnd),
                offset: entryOffset + 8,
                bigEnd,
            };
        }
    }

    return tags;
}

function correctOrientation(buffer, { offset, bigEnd }) {
    const dataView = new DataView(buffer);
    dataView.setUint16(offset, 1, !bigEnd);

    return dataView.buffer;
}

export default function getOrientation(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function () {
            let buffer = reader.result;
            const tags = findEXIFinJPEG(buffer);

            if (tags && tags.Orientation && tags.Orientation.value !== 1) {
                buffer = correctOrientation(buffer, tags.Orientation);
            }

            resolve({
                orientation: tags && tags.Orientation ? tags.Orientation.value : 1,
                file: new Blob([buffer], {
                    type: file.type,
                }),
            });
        };
        reader.readAsArrayBuffer(file);
    });
}
