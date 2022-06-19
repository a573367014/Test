import $ from '@gaoding/editor-utils/zepto';
import utils from './utils';

function PasteImage(successCall, failCall, options) {
    // createImage
    function createImage(imageData, loaded) {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = function () {
            loaded(this);
        };
        image.src = imageData;
        return image;
    }

    // Copy
    function doCopy(e) {
        if (options.editor && !['design', 'flow'].includes(options.editor.mode)) return;

        const anchorNode = window.getSelection && window.getSelection().anchorNode;
        // 如果选中了文字
        if ((anchorNode || document.activeElement) && options.container) {
            // 且在编辑器以外的
            if (
                options.container !== anchorNode &&
                options.container !== document.activeElement &&
                !$.contains(options.container, document.activeElement) &&
                !$.contains(options.container, anchorNode)
            ) {
                // 需要允许浏览器默认的复制行为
                return;
            }
        }
        if (utils.isEditable(e.target)) {
            return;
        }
        e.clipboardData.setData('text/plain', '');
        e.preventDefault();
    }

    // Cut
    function doCut(e) {
        return doCopy(e);
    }

    // Paste
    function doPaste(e) {
        if (utils.isEditable(e.target)) {
            return;
        }

        const files = [];
        if (e.clipboardData) {
            const items = e.clipboardData.items;
            let stopFlag = false;

            if (items) {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    // 粘贴表格
                    if (
                        item &&
                        item.type.indexOf('html') !== -1 &&
                        e.clipboardData.getData('text')
                    ) {
                        return failCall(e);
                    }

                    if (item && item.type.indexOf('image') !== -1) {
                        files.push(item.getAsFile());
                    }
                }

                if (options && options.beforeHook && files.length) {
                    stopFlag = options.beforeHook(files) === false;
                }

                if (!stopFlag) {
                    files.forEach((blob) => {
                        if (options.editor.options.resource.blobUrlEnable) {
                            createImage(URL.createObjectURL(blob), successCall);
                        } else {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                createImage(e.target.result, successCall);
                            };
                            reader.readAsDataURL(blob);
                        }
                        e.preventDefault();
                    });
                }
            }

            // No element from system clipboard!
            if (!files.length) {
                failCall(e);
            }
        }
    }

    this.destroy = function () {
        document.removeEventListener('copy', doCopy, false);
        document.removeEventListener('cut', doCut, false);
        document.removeEventListener('paste', doPaste, false);
    };

    this.init = function () {
        document.addEventListener('copy', doCopy, false);
        document.addEventListener('cut', doCut, false);
        document.addEventListener('paste', doPaste, false);
    };

    this.init();
}

export default PasteImage;
