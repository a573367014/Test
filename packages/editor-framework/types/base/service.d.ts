import type { IVPEditor } from '../types/editor';
export declare class BaseService {
    editor: IVPEditor;
    constructor(editor: IVPEditor);
}
export declare class ServiceManager {
    editor: IVPEditor;
    cache: Map<string, BaseService>;
    constructor(editor: IVPEditor);
    load(type: string): Promise<BaseService>;
}
