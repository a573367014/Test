import EventHook from './event-hook';

export default function createComponent(Vue, definitions = []) {
    if (!Array.isArray(definitions)) {
        definitions = [definitions];
    }

    // 编辑器内部组件均基于 EventHook extend 以获得事件总线通信能力
    let Component = Vue.extend(EventHook);

    // 在此处收集组件中声明的 events 钩子，从而在 extend 时基于闭包保证各组件正确实例化。
    // key 形如 'transform.resizing' 等，value 为相应回调数组。
    const allEvent = {};

    const registerEvents = (definitions, extend = true) => {
        definitions.forEach((definition) => {
            const events = definition.events;

            if (definition.mixins) {
                registerEvents(definition.mixins, false);
            }

            for (const key in events) {
                if (!allEvent[key]) {
                    allEvent[key] = [];
                }
                allEvent[key].push(events[key]);
            }

            if (extend) {
                Component = Component.extend(definition);
            }
        });
    };

    registerEvents(definitions);

    // 基于组件 events 配置，在各组件的生命周期向事件总线注册或销毁事件回调
    Component = Component.extend({
        created() {
            const eventStore = (this.$eventStore = {});
            const events = this.$events;
            if (!events) {
                return;
            }

            for (const key in allEvent) {
                // 存储 handler 以便解绑
                this.$eventStore[key] = [];
                allEvent[key].forEach((event) => {
                    const handler = event.bind(this);

                    eventStore[key].push(handler);
                    events.$on(key, handler);
                });
            }
        },

        beforeDestroy() {
            const eventStore = this.$eventStore;
            const events = this.$events;

            if (!events) {
                return;
            }

            for (const key in eventStore) {
                eventStore[key].forEach((event) => {
                    events.$off(key, event);
                });
            }
        },
    });

    return Component;
}
