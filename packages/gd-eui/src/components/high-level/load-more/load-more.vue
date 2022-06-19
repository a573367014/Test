<template>
    <div class="ge-load-more" ref="loadMoreRef">
        <div @click="reload" v-if="isError" :class="['ge-load-more__btn', 'ge-load-more__error']">
            <slot name="error">
                加载失败，
                <span class="ge-load-more__primary-text">请重试</span>
            </slot>
        </div>

        <div v-else-if="innerNoMore">
            <div class="ge-load-more__nomore">
                <!-- 这里提供了默认文本，提供了默认的组件gd-nomore模板 -->
                <slot name="nomore">没有更多了</slot>
            </div>
        </div>

        <template v-else>
            <slot name="more" :reload="reload" :isLoading="pending" v-if="!autoLoad">
                <div class="ge-load-more__btn" @click="reload">
                    <ge-icon v-if="pending" type="loading" />
                    加载更多
                </div>
            </slot>

            <div v-else class="ge-load-more__loading">
                <slot name="loading">
                    <Spin>
                        <ge-icon slot="indicator" type="loading" spin />
                    </Spin>
                    玩命加载中...
                </slot>
            </div>
        </template>

        <slot name="footer" />
    </div>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref, onBeforeUnmount, PropType } from '@vue/composition-api';
import Spin from '@gaoding/gd-antd/es/spin';

/**
 * @title 组件名
 * GeLoadMore
 */
/**
 * @title 描述
 * 为容器提供在滑动到底部或空白情况下触发加载更多请求
 */
/**
 * @markdown
 * ### 使用场景
 * - 列表加载更多触发
 * - 加载更多样式定义
 */
export default defineComponent({
    name: 'GeLoadMore',
    components: {
        Spin,
    },
    props: {
        /**
         * 业务方请求接口，请使用async方式定义
         **/
        loadMore: {
            type: Function as PropType<() => Promise<void>>,
            required: true,
        },
        // 是否自动加载更多
        autoLoad: {
            type: Boolean,
            default: true,
        },
        // 无数据状态
        isNoMore: {
            type: Boolean,
            default: false,
        },
        // 加载失败状态
        isError: {
            type: Boolean,
            default: false,
        },
        // 视图窗口展示的百分比 执行数据加载
        threshold: {
            type: Number,
            default: 0.5,
        },
        // 距离底部加载的距离
        offset: {
            type: Number,
            default: 0,
        },
    },
    emits: [
        /**
         * 请求error，异常回调
         */
        'error',
    ],
    setup(props, { emit }) {
        const pending = ref(false);
        const innerNoMore = ref(props.isNoMore);
        const loadMoreRef = ref();
        let intersectionRatio = 0;
        let observer: IntersectionObserver | null = null;

        onBeforeUnmount(() => {
            if (loadMoreRef.value && observer) {
                observer.unobserve(loadMoreRef.value);
                observer = null;
            }
        });
        onMounted(() => {
            // 传入fn进来 dom 渲染交给业务  返回promise 来操作页面loading状态
            const onIntersection = (observation: IntersectionObserverEntry[]) => {
                observation.forEach(async (change: IntersectionObserverEntry) => {
                    intersectionRatio = change.intersectionRatio;
                    tryLoad();
                });
            };
            observer = new IntersectionObserver(onIntersection, {
                threshold: [0, 0.25, 0.5, 0.75, 1],
                rootMargin: `0px 0px ${props.offset}px 0px`,
            });
            observer.observe(loadMoreRef.value);
        });

        const tryLoad = async () => {
            if (!pending.value && intersectionRatio > props.threshold && observer) {
                // 无数据状态 数据加载失败状态 不触发分页加载
                if (!props.autoLoad || props.isError || props.isNoMore) {
                    return;
                }
                await load();
            }
        };

        /**
         * @function
         * 刷新加载
         */
        const reload = async () => {
            await load();
        };
        const load = async () => {
            pending.value = true;
            try {
                await props.loadMore();
                pending.value = false;

                // 处理加载更多后，组件仍处于视口，需要再重新重新加载下一页
                setTimeout(() => {
                    tryLoad();
                }, 0);
            } catch (error) {
                pending.value = false;
                emit('error');
            }
        };
        return {
            pending,
            innerNoMore,
            loadMoreRef,
            reload,
        };
    },
});
</script>
