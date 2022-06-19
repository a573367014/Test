<style lang="less">
</style>

<template>
    <label @dragover.prevent="$event.preventDefault()" @drop="handleDrop" >
        <slot />
        <input
            class="file-picker"
            type="file"
            hidden
            :accept="accept"
            :multiple="multiple"
            :capture="capture"
            @change="handleInput"
        >
    </label>
</template>

<script>
import { correctImageOrientation } from '@gaoding/editor-utils/correct-image-orientation';

let pasteHandler, dragoverHandler, dragleaveHandler, dropHandler;

function promisifyGetAsString(e, index, type) {
    return new Promise((resolve, reject) => {
        try {
            e.clipboardData.items[index].getAsString((text) => {
                if(/<meta charset='utf-8'>/.test(text)) {
                    resolve('image.' + type.replace(/\w+\//, ''));
                }
                else {
                    resolve(text);
                }
            });
        }
        catch(error) {
            reject(error);
        }
    });
}
export default {
    props: {
        accept: {
            type: String,
            default: 'image/jpg, image/jpeg, image/png'
        },
        capture: {
            type: Boolean,
            default: false
        },
        multiple: {
            type: Boolean,
            default: false
        },
        max: {
            type: Number,
            default: 1
        },
        validate: {
            type: Function,
            default: () => {
                return Promise.resolve(true);
            }
        },
        strictMIMEValidation: {
            type: Boolean,
            default: false
        },
        dragAndDrop: {
            type: Boolean,
            default: false
        },
        copyAndPaste: {
            type: Boolean,
            default: false
        },
        dropNodeSelector: {
            type: String,
            default: ''
        },
        pasteNodeSelector: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            useMIMEValiation: false,
        };
    },
    computed: {
        dropNode() {
            if(!this.dragAndDrop) {
                return null;
            }
            if(!this.dropNodeSelector) {
                return document.body;
            }
            const dropNode = document.querySelector(this.dropNodeSelector);
            if(dropNode) {
                return dropNode;
            }
            return document.body;
        },
        pasteNode() {
            if(!this.copyAndPaste) {
                return null;
            }
            if(!this.pasteNodeSelector) {
                return document.body;
            }
            const pasteNode = document.querySelector(this.pasteNodeSelector);
            if(pasteNode) {
                return pasteNode;
            }
            return document.body;
        }
    },
    watch: {
        accept() {
            this.validateAcceptProps();
        },
        strictMIMEValidation() {
            this.validateAcceptProps();
        },
        dropNodeSelector() {
            this.unbindDragEvents();
            this.bindDragEvents();
        },
        dragAndDrop() {
            this.unbindDragEvents();
            this.bindDragEvents();
        },
        pasteNodeSelector() {
            this.unbindDragEvents();
            this.bindDragEvents();
        },
        copyAndPaste() {
            this.unbindDragEvents();
            this.bindDragEvents();
        }
    },
    mounted() {
        this.validateAcceptProps();
        pasteHandler = this.handlePaste.bind(this);
        dragoverHandler = this.handleDragover.bind(this);
        dragleaveHandler = this.handleDragleave.bind(this);
        dropHandler = this.handleDrop.bind(this);
        this.bindDragEvents();
        this.bindPasteEvent();
    },
    beforeDestroy() {
        this.unbindDragEvents();
        this.unbindPasteEvent();
    },
    methods: {
        async handleInput(e) {
            let files = e.target.files;

            if(!files) {
                return;
            }

            files = Array.from(files);
            e.target.value = '';

            files = await this.validateFiles(files);
            files = await Promise.all(files.map(correctImageOrientation));

            this.emitFiles(files);
        },
        async handleDrop(e) {
            if(!this.dragAndDrop) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            if(!e.dataTransfer) {
                return;
            }
            const files = e.dataTransfer.files;
            if(!files.length) {
                return;
            }
            const result = await this.validateFiles(files);
            this.dropNode.classList.remove('file-picker--dragover');
            this.$emit('drop', e);
            this.emitFiles(result);
        },
        async handlePaste(e) {
            if(!e.clipboardData || !this.copyAndPaste) {
                return;
            }
            let files = [];
            const ua = navigator.userAgent;
            if(/chrome/i.test(ua)) {
                files = await this.parseClipboardDataForChrome(e);
            }
            else if(/safari/i.test(ua)) {
                files = this.parseClipboardDataForSafariAndFireFox(e);
            }
            else if(/firefox/i.test(ua)) {
                files = this.parseClipboardDataForSafariAndFireFox(e);
            }
            const result = await this.validateFiles(files);
            this.emitFiles(result);
        },
        async validateFiles(files) {
            const result = [];
            for(let i = 0; i < files.length; i++) {
                const file = files[i];
                if(this.useMIMEValiation) {
                    const types = this.accept.toUpperCase().replace(/\w+\//g, '').replace(/, ?/g, '/');
                    const errMsg = `仅支持 ${types} 格式的文件`;
                    if(!file.type) {
                        this.$emit('error', Error(errMsg));
                        return [];
                    }
                    const mimeValidation = this.accept.includes(file.type);
                    if(!mimeValidation) {
                        this.$emit('error', Error(errMsg));
                        return [];
                    }
                }
                if(this.validate) {
                    const customValidation = await this.validate(file);
                    if(!customValidation) {
                        return [];
                    }
                }
                result.push(file);
            }
            return result;
        },
        validateAcceptProps() {
            if(!this.strictMIMEValidation) {
                this.useMIMEValiation = false;
                return;
            }
            const accept = this.accept.split(/, ?/);
            for(let i = 0; i < accept.length; i++) {
                const type = accept[i];
                if(!/^[-\w.]+\/[-\w.]+$/gm.test(type)) {
                    console.warn(`如果使用strictMIMEValidation，需要在accept属性中传入标准MIME类型。"${type}"为无效类型。`);
                    this.useMIMEValiation = false;
                    return;
                }
            }
            this.useMIMEValiation = true;
        },
        async parseClipboardDataForChrome(e) {
            const { items } = e.clipboardData;
            const result = [];
            for(let i = 0; i < items.length; i++) {
                const item = items[i];
                if(item.kind !== 'file') {
                    continue;
                }
                let file = item.getAsFile();
                if(!file) {
                    continue;
                }
                // 如果是系统文件，mac会返回两个items数据，
                // 第一个是type为string，一般为文件名称，第二个是type为file。
                // 如果是多个文件只返回一个文件的内容。window目前不返回任何数据。
                // https://bugs.chromium.org/p/chromium/issues/detail?id=316472
                // 如果是利用工具进行屏幕截图，只返回一个items数据，type为file，文件名称默认为‘image.png’。
                // 如果是复制网页图片，只返回一个items数据，type为file，文件名为‘<meta charset='utf-8'><img src="XXXX" alt="XXXX"/>’，
                // 需要特殊处理，否则oss会报错。
                if(items[i - 1]) {
                    try {
                        const name = await promisifyGetAsString(e, i - 1, file.type);
                        file = new File([file], name, { type: file.type });
                    }
                    catch(error) {
                        console.error(error);
                    }
                }
                result.push(file);
            }
            return result;
        },
        parseClipboardDataForSafariAndFireFox(e) {
            // Safari对复制系统文件支持完备；截图、复制网页图片返回内容正常，文件名默认为‘image.png’
            // firefox对复制系统文件不支持。支持截图和复制网页内容，文件名默认为‘image.png’。
            return e.clipboardData.files;
        },
        handleDragover(e) {
            if(!this.dragAndDrop) {
                return;
            }
            this.dropNode.classList.add('file-picker--dragover');
            e.preventDefault();
            e.stopPropagation();
            this.$emit('dragover', e);
        },
        handleDragleave(e) {
            if(!this.dragAndDrop) {
                return;
            }
            this.dropNode.classList.remove('file-picker--dragover');
            this.$emit('dragleave', e);
        },
        bindPasteEvent() {
            if(this.pasteNode) {
                this.pasteNode.addEventListener('paste', pasteHandler);
            }
        },
        unbindPasteEvent() {
            if(this.pasteNode) {
                this.pasteNode.removeEventListener('paste', pasteHandler);
            }
        },
        bindDragEvents() {
            if(this.dropNode) {
                const dropNode = this.dropNode;
                dropNode.addEventListener('dragover', dragoverHandler);
                dropNode.addEventListener('dragleave', dragleaveHandler);
                dropNode.addEventListener('drop', dropHandler);
            }
        },
        unbindDragEvents() {
            if(this.dropNode) {
                const dropNode = this.dropNode;
                dropNode.removeEventListener('dragover', dragoverHandler);
                dropNode.removeEventListener('dragleave', dragleaveHandler);
                dropNode.removeEventListener('drop', dropHandler);
            }
        },
        emitFiles(files) {
            if(files.length > this.max) {
                this.$emit('max-exceed', files.length);
            }

            if(!files.length) {
                return;
            }
            if(!this.multiple) {
                files = [files[0]];
            }
            else if(files.length > this.max) {
                files = files.slice(0, this.max);
            }
            this.$emit('change', files);
            this.$emit('input', files);
        }
    }
};
</script>
