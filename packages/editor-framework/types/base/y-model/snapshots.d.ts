import { YBinding } from './binding';
export declare class Snapshots {
    callbackEnable: boolean;
    private _binding;
    private _onChange;
    private _changeCount;
    constructor(binding: YBinding, onChange?: () => void);
    get undoMgr(): import("@gaoding/yjs").UndoManager;
    get hasUndo(): boolean;
    get hasRedo(): boolean;
    get changeCount(): number;
    reset(): void;
    undo(): void;
    redo(): void;
}
