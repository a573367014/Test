class Dragger {
    constructor(el, binding) {
        this.el = el;
        this.initalX = 0;
        this.initalY = 0;
        this.preX = 0;
        this.preY = 0;

        const callback = binding.value;
        if(typeof callback !== 'function') {
            throw new Error('dragger must be a function');
        }
        this.callback = callback;
        this.mouseDown = this.handlerMouseDown.bind(this);
        this.mouseUp = this.handleMouseUp.bind(this);
        this.mouseMove = this.handleMouseMove.bind(this);
        el.addEventListener('mousedown', this.mouseDown);
    }

    handlerMouseDown(event) {
        if(document.activeElement === this.el) {
            return;
        }
        this.initalX = event.pageX;
        this.initalY = event.pageY;
        this.preX = event.pageX;
        this.preY = event.pageY;
        document.body.addEventListener('mousemove', this.mouseMove);
        document.body.addEventListener('mouseup', this.mouseUp);
        event.preventDefault();
    }

    handleMouseMove(event) {
        this.callback({
            pageX: event.pageX,
            pageY: event.pageY,
            initalX: this.initalX,
            initalY: this.initalY,
            preX: this.preX,
            preY: this.preY,
            event: event
        });
        this.preX = event.pageX;
        this.preY = event.pageY;
    }

    handleMouseUp(event) {
        const diffX = event.pageX - this.initalX;
        const diffY = event.pageY - this.initalY;
        if(Math.abs(diffX) <= 2 && Math.abs(diffY) <= 2) {
            if(this.el.tagName === 'INPUT') {
                this.el.focus();
                this.el.select();
            }
        }
        this.removeEventListener();
    }

    removeEventListener() {
        document.body.removeEventListener('mousemove', this.mouseMove);
        document.body.removeEventListener('mouseup', this.mouseUp);
    }

    destory() {
        this.el.removeEventListener('mousedown', this.mouseDown);
        this.el = null;
        this.removeEventListener();
    }
}

export const dragger = {
    bind: function(el, binding) {
        const dragger = new Dragger(el, binding);
        el.dragger = dragger;
    },
    unbind: function(el) {
        el.dragger.removeEventListener();
    }
};
