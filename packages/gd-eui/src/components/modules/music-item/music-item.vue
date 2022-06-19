<template>
    <div class="ge-music-item" @mouseenter="onItemMouseEnter" @mouseleave="onItemMouseLeave">
        <div class="ge-music-item__icon" :style="{ backgroundImage: `url(${preview})` }">
            <div class="ge-music-item__cover__play" @mousedown.stop @click.stop="onCoverClick">
                <ge-icon
                    v-show="showIcon"
                    class="ge-music-item__cover__play__icon"
                    :class="{ cover_loading_icon_active: status === MusicItemStatus.LOADING }"
                    :type="coverIcon"
                />
            </div>
            <div class="ge-music-item__icon__tag">
                <slot name="tagContent"></slot>
            </div>
        </div>
        <div class="ge-music-item__desc">
            <div class="ge-music-item__desc__title">
                <div
                    class="ge-music-item__desc__title__label"
                    :class="{ active: status === MusicItemStatus.PLAYING }"
                >
                    {{ title }}
                </div>
                <key-line-mini
                    v-show="status === MusicItemStatus.PLAYING"
                    class="ge-music-item__desc__title__keyline"
                />
            </div>
            <div class="ge-music-item__desc__time">
                {{ status === MusicItemStatus.LOADING ? '加载中...' : durationFilter }}
            </div>
            <ge-icon
                class="ge-music-item__desc__add"
                type="plus_circle_fill"
                @click.stop="onAddClick"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import KeyLineMini from './keyline-mini.vue';
import { MusicItemStatus } from '../../../types/music-item';
import { PLAY_EVENT, PAUSE_EVENT, ADD_EVENT } from '../../../utils/constants';
import { formatTime } from '../../../utils/index';

/**
 * @title 组件名
 * GeMusicItem
 */
/**
 * @title 描述
 * 用于音乐展示
 */
/**
 * @title 使用场景
 * @dot 音乐预览
 * @dot 音乐播放状态
 */
export default defineComponent({
    name: 'GeMusicItem',
    components: {
        KeyLineMini,
    },
    props: {
        /**
         * 播放状态
         */
        status: {
            type: Number as PropType<MusicItemStatus>,
            default: MusicItemStatus.IDLE,
        },
        // 预览图
        preview: {
            type: String,
            default: '',
        },
        // 音乐名称
        title: {
            type: String,
            default: '',
        },
        // 时长
        duration: {
            type: Number,
            default: 0,
        },
    },
    emits: [
        /**
         * 点击播放的时候回调
         */
        'play',
        /**
         * 点击暂停的时候回调
         */
        'pause',
        /**
         * 点击+的时候回调
         */
        'add',
    ],
    setup(props, { emit }) {
        const inItem = ref(false);
        const showIcon = computed(() => {
            if (props.status === MusicItemStatus.LOADING) {
                return true;
            }
            return inItem.value;
        });
        const durationFilter = computed(() => {
            return formatTime(props.duration);
        });
        const coverIcon = computed(() => {
            let statusIcon = '';
            switch (props.status) {
                case MusicItemStatus.IDLE:
                case MusicItemStatus.PAUSE:
                    statusIcon = 'play_fill';
                    break;
                case MusicItemStatus.LOADING:
                    statusIcon = 'loading';
                    break;
                case MusicItemStatus.PLAYING:
                    statusIcon = 'pause_fill';
                    break;
                default:
                    break;
            }
            return statusIcon;
        });

        const onCoverClick = () => {
            if (props.status === MusicItemStatus.IDLE || props.status === MusicItemStatus.PAUSE) {
                // 点击播放时的回调 @play
                emit(PLAY_EVENT);
                return;
            }
            if (props.status === MusicItemStatus.PLAYING) {
                // 点击暂停时的回调 @pause
                emit(PAUSE_EVENT);
            }
        };
        const onAddClick = () => {
            // 点击添加时的回调 @add
            emit(ADD_EVENT);
        };
        const onItemMouseEnter = () => {
            inItem.value = true;
        };
        const onItemMouseLeave = () => {
            inItem.value = false;
        };
        return {
            coverIcon,
            showIcon,
            MusicItemStatus,
            durationFilter,
            onCoverClick,
            onAddClick,
            onItemMouseEnter,
            onItemMouseLeave,
        };
    },
});
</script>
