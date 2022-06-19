<script lang="ts">
import type { PrivateAssets } from './index';
import { ref, watch, PropType, defineComponent, h } from '@vue/composition-api';
import { getPrivateUrl, getStylePrivateUrl } from './util';

export default defineComponent({
    props: {
        tag: {
            type: String as PropType<string>,
            default: 'div',
        },
        src: {
            type: String as PropType<string>,
            default: '',
        },
        cstyle: {
            type: [String, Object],
            default: '',
        },
        getPrivateKey: {
            type: [Function] as PropType<PrivateAssets['getPrivateKey'] | null>,
            default: null,
        },
    },
    setup(props, { slots }) {
        const innerStyle = ref(props.cstyle);
        const innerSrc = ref(props.src);

        watch(
            () => props.cstyle,
            async () => {
                const authKey = (await props.getPrivateKey?.()) || '';
                innerStyle.value = getStylePrivateUrl(props.cstyle, authKey);
            },
            {
                immediate: true,
            },
        );

        const hasSrc = props.tag === 'img' || props.tag === 'video' || props.tag === 'audio';
        if (hasSrc) {
            watch(
                () => props.src,
                async () => {
                    const authKey = (await props.getPrivateKey?.()) || '';
                    innerSrc.value = getPrivateUrl(props.src, authKey);
                },
                {
                    immediate: true,
                },
            );
        }

        return () => {
            return h(
                props.tag,
                hasSrc
                    ? {
                          attrs: {
                              src: innerSrc.value,
                          },
                          style: innerStyle.value,
                      }
                    : {
                          style: innerStyle.value,
                      },
                slots.default?.(),
            );
        };
    },
});
</script>
