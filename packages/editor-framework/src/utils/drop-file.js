import Promise from 'bluebird';

// loadImage
function loadImage(url, loaded = () => {}) {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.onload = function () {
        loaded(image);
    };
    image.src = url;
    return image;
}

// createImage
function createImage(file, success = () => {}, blobUrl) {
    // 判断文件类型
    if (file.type.match(/image\/(jpeg|gif|png)/)) {
        if (blobUrl) {
            loadImage(URL.createObjectURL(file), success);
        } else {
            const reader = new FileReader();
            reader.onload = function (e) {
                loadImage(e.target.result, success);
            };
            reader.readAsDataURL(file);
        }
    } else {
        // console.log("此" + file.name + "不是图片文件！");
    }
}

function DropFile(elem, events, blobUrl) {
    const dragover = function (e) {
        (events.dragover || function () {}).call(elem, e);
    };

    const drop = function (e) {
        e.preventDefault();
        if (e.dataTransfer.types[0] !== 'Files') {
            return;
        }
        const originfiles = e.dataTransfer.files;

        return Promise.try(() => {
            return events.beforeDrop(originfiles);
        }).then((files) => {
            for (let i = 0, len = files.length; i < len; i++) {
                createImage(files[i], events.drop || function () {}, blobUrl);
            }
        });
    };

    this.destory = function () {
        elem = this.elem;
        elem.removeEventListener('dragover', dragover, false);
        elem.removeEventListener('drop', drop, false);
    };

    this.init = function (elem, events) {
        this.elem = elem;
        this.events = events;

        elem.addEventListener('dragover', dragover, false);
        elem.addEventListener('drop', drop, false);
    };

    this.init(elem);
}

export default DropFile;
