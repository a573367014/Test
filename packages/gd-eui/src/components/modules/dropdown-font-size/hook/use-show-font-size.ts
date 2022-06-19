import { Ref, computed } from '@vue/composition-api';

export const useShowFontSize = (innerValue: Ref<number>, mixed: Ref<boolean>) => {
    const showFontSize = computed(() => {
        if (mixed.value) {
            return '…';
        }
        return innerValue.value + '';
    });
    return {
        showFontSize,
    };
};
