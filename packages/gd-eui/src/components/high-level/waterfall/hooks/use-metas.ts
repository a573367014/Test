import { IProps, MetaList } from '../../../../types/waterfall';
// import { ITEM_CLASS_NAME } from '../../../../utils/constants';
import { on, off } from '../utils';
import {
    toRefs,
    ref,
    Ref,
    watch,
    onMounted,
    onUnmounted,
    // isVue2,
    // isVue3,
} from '@vue/composition-api';
import eventBus from '../../../../utils/event';

/**
 * 根据参数配置和dom情况得出响应式的metas
 * @param props waterfall的props
 * @param waterfallNode 容器的dom节点
 * @param slots setup中传过来的slots
 * @returns 响应式的metas
 */
export function useMetas(props: IProps, waterfallNode: Ref<HTMLElement | null>, slots: any) {
    const metas = ref<MetaList>([]);

    const {
        autoResize,
        align,
        line,
        lineGap,
        minLineGap,
        maxLineGap,
        singleMaxWidth,
        fixedHeight,
        watchTarget,
        flex,
    } = toRefs(props);

    eventBus.on('reflow', () => {
        refreshMetas();
    });

    watch(
        () => [
            align.value,
            line.value,
            lineGap.value,
            minLineGap.value,
            maxLineGap.value,
            singleMaxWidth.value,
            fixedHeight.value,
            watchTarget.value,
            flex.value,
        ],
        refreshMetas,
        { deep: true },
    );

    const timer = ref<any>(undefined);
    /**
     * 更新metas
     */
    function refreshMetas() {
        clearTimeout(timer.value);
        timer.value = setTimeout(() => {
            metas.value = getMetasFromChildren();
        }, props.interval);
    }

    onMounted(() => {
        watch(autoResize, autoResizeHandler);
        autoResizeHandler(autoResize.value);
    });
    onUnmounted(() => {
        autoResizeHandler(false);
    });

    function autoResizeHandler(isAutoResize: boolean) {
        if (isAutoResize === false || !autoResize.value) {
            off(window, 'resize', refreshMetas, false);
        } else {
            on(window, 'resize', refreshMetas, false);
        }
    }
    /**
     * 从waterfall-item中返回metas数据
     * @returns metas配置
     */
    function getMetasFromChildren() {
        let list: MetaList = [];
        function check(condition: boolean) {
            if (condition) {
                console.warn('未找到waterfall-item组件');
                return true;
            }
        }
        // if (isVue3) {
        //     const waterfallItems = waterfallNode.value!.querySelectorAll(`.${ITEM_CLASS_NAME}`);
        //     if (check(!waterfallItems.length)) return [];
        //     list = [].map.call(waterfallItems, (el: HTMLElement) =>
        //         // @ts-ignore vue3里面获取子组件不太方便，妥协写法
        //         el.__vueParentComponent.exposed.getMeta(),
        //     ) as MetaList;
        // } else if (isVue2) {
        //     if (check(!slots.default)) return [];
        //     list = slots
        //         .default()
        //         .filter((vnode: any) => vnode.child?.getMeta)
        //         .map((vnode: any) => vnode.child.getMeta());
        // } else {
        //     console.warn('不兼容的vue版本');
        // }
        if (check(!slots.default)) return [];
        list = slots
            .default()
            .filter((vnode: any) => vnode.child?.getMeta)
            .map((vnode: any) => vnode.child.getMeta());
        return list.sort((a, b) => a.order - b.order);
    }

    return {
        metas,
    };
}
