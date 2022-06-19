import { IRect, RectList, IMeta, MetaList } from '../../../../types/waterfall';
import { MOVE_CLASS_PROP } from '../../../../utils/constants';
import { onMounted, onUnmounted, Ref } from '@vue/composition-api';
import { on, off } from '../utils';

export function useRender(waterfallNode: Ref<HTMLElement | null>) {
    /**
     * 根据计算，对元素节点的差异进行patch并渲染
     * @param rects 计算后的元素几何配置
     * @param metas 元数据
     */
    function render(rects: RectList, metas: MetaList) {
        const metasNeedToMoveByTransform = metas.filter((meta) => meta.moveClass);
        // 首先获取一下数值，
        const firstRects = getRects(metasNeedToMoveByTransform);
        applyRects(rects, metas);
        const lastRects = getRects(metasNeedToMoveByTransform);
        // 应用动画
        metasNeedToMoveByTransform.forEach((meta, i) => {
            meta.node[MOVE_CLASS_PROP] = meta.moveClass;
            setTransform(meta.node, firstRects[i], lastRects[i]);
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        document.body.clientWidth; // forced reflow
        metasNeedToMoveByTransform.forEach((meta) => {
            meta.node.classList.add(meta.moveClass);
            clearTransform(meta.node);
        });
    }

    function getRects(metas: MetaList) {
        return metas.map((meta) => meta.rect.detail);
    }

    /**
     * metas记录最新的rects
     * @param rects 计算后的元素几何配置
     * @param metas 元数据
     */
    function applyRects(rects: RectList, metas: MetaList) {
        rects.forEach((rect, i) => {
            const style = metas[i].node.style;
            metas[i].rect.detail = rect;

            for (const prop in rect) {
                const propName = prop as keyof IRect;
                style[propName] = rect[propName] + 'px';
            }
        });
    }

    /**
     * 对元素dom进行渲染
     * @param node 元素节点
     * @param firstRect 初始几何值
     * @param lastRect 变更的几何值
     */
    function setTransform(node: HTMLElement, firstRect: IRect, lastRect: IRect) {
        const dx = firstRect.left - lastRect.left;
        const dy = firstRect.top - lastRect.top;
        const sw = firstRect.width / lastRect.width;
        const sh = firstRect.height / lastRect.height;
        node.style.transform = `translate(${dx}px,${dy}px) scale(${sw},${sh})`;
        node.style.transitionDuration = '0s';
    }

    /**
     * 清除变换
     * @param node 元素节点
     */
    function clearTransform(node: HTMLElement) {
        node.style.transform = '';
        node.style.transitionDuration = '';
    }
    /**
     * 清除动画class
     */
    function tidyUpAnimations(event: Event) {
        const node = event.target as IMeta['node'];
        const moveClass = node![MOVE_CLASS_PROP];
        if (moveClass) {
            node.classList.remove(moveClass);
        }
    }
    onMounted(() => {
        on(waterfallNode.value!, 'transitionend', tidyUpAnimations, true);
    });

    onUnmounted(() => {
        off(waterfallNode.value!, 'transitionend', tidyUpAnimations, true);
    });

    return { render };
}
