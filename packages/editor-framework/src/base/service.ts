import type { IVPEditor } from '../types/editor';

export class BaseService {
    editor: IVPEditor;
    constructor(editor: IVPEditor) {
        this.editor = editor;
    }
}

export class ServiceManager {
    editor: IVPEditor;
    cache = new Map<string, BaseService>();
    constructor(editor: IVPEditor) {
        this.editor = editor;
    }

    async load(type: string): Promise<BaseService> {
        await this.editor.createAsyncComponent({ type });
        return this.cache.get(type);
    }
}
