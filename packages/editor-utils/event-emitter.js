import $ from './zepto';

export default class EventEmitter {
    constructor() {
        this.$events = $({});
    }

    get on() {
        return this.$events.on.bind(this.$events);
    }

    get once() {
        return this.$events.one.bind(this.$events);
    }

    get off() {
        return this.$events.off.bind(this.$events);
    }

    get emit() {
        return this.$events.trigger.bind(this.$events);
    }
}
