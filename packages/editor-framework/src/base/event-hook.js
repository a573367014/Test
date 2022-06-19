/**
 * EventHook
 * 编辑器基础组件，编辑器内部组件均隐式继承它，以获得对事件总线的访问能力
 */

// 挂载于 Editor 根节点实例上的事件总线字段名
const eventBusName = '_eventBus';

// 在通用的 Vue 组件树中寻找 Vue 构造器
const getVueConstructor = (VueComponentContext) => {
    let Ctor = VueComponentContext.constructor;
    while (Ctor.super) {
        Ctor = Ctor.super;
    }

    return Ctor;
};

export default {
    computed: {
        // 尝试向上寻找事件总线至 Editor 根节点，并返回其实例
        $events() {
            let vm = this;

            while (vm && !Object.prototype.hasOwnProperty.call(vm, eventBusName)) {
                if (vm.editor && vm.editor.layouts) {
                    vm = vm.editor;
                    break;
                }

                vm = vm.$parent;
            }

            return (vm && vm[eventBusName]) || this.$createEventBus();
        },
    },
    methods: {
        // 在 Editor 根节点上，寻找 Vue 构造器，将其实例作为事件总线
        $createEventBus() {
            if (!Object.prototype.hasOwnProperty.call(this, eventBusName)) {
                const EventBusCtor = getVueConstructor(this);
                const eventBus = new EventBusCtor();
                eventBus.dispatchMouseEvent = true;
                this[eventBusName] = eventBus;
            }

            return this[eventBusName];
        },
    },
};
