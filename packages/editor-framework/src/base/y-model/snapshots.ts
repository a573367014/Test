import { YBinding, logVPEAction } from './binding';

const noop = () => {};

// 为兼容原有 StateShot API 的 Yjs UndoManager 适配层
export class Snapshots {
    public callbackEnable = true;
    private _binding: YBinding;
    private _onChange: (state: any) => void;
    private _changeCount = 0;

    constructor(binding: YBinding, onChange = noop) {
        this._binding = binding;
        this._onChange = onChange;

        this.undoMgr.on('stack-item-added', (state) => {
            this._changeCount++;
            this.callbackEnable && this._onChange(state);
        });
        this.undoMgr.on('stack-item-popped', (state) => {
            this._changeCount++;
            this.callbackEnable && this._onChange(state);
        });
    }

    get undoMgr() {
        return this._binding.undoMgr;
    }

    get hasUndo(): boolean {
        return this.undoMgr.undoStack.length > 0;
    }

    get hasRedo(): boolean {
        return this.undoMgr.redoStack.length > 0;
    }

    get changeCount() {
        return this._changeCount;
    }

    reset() {
        this.undoMgr.clear();
    }

    undo() {
        logVPEAction('undo');
        this.undoMgr.undo();
    }

    redo() {
        logVPEAction('redo');
        this.undoMgr.redo();
    }
}
