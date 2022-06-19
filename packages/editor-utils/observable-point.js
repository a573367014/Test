function ObservablePoint(cb, x, y) {
    this._x = x || 0;
    this._y = y || 0;

    this.cb = cb;
}

Object.defineProperties(ObservablePoint.prototype, {
    x: {
        get() {
            return this._x;
        },
        set(value) {
            if (this._x !== value) {
                this._x = value;
                this.cb();
            }
        },
    },

    y: {
        get() {
            return this._y;
        },
        set(value) {
            if (this._y !== value) {
                this._y = value;
                this.cb();
            }
        },
    },
});

ObservablePoint.prototype.set = function (x, y) {
    const _x = x || 0;
    const _y = y || (y !== 0 ? _x : 0);
    if (this._x !== _x || this._y !== _y) {
        this._x = _x;
        this._y = _y;
        this.cb();
    }
};

ObservablePoint.prototype.copy = function (point) {
    if (this._x !== point.x || this._y !== point.y) {
        this._x = point.x;
        this._y = point.y;
        this.cb();
    }
};

export default ObservablePoint;
