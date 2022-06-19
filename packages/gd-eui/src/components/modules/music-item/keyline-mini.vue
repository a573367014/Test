<template>
    <div class="ge-keyline-mini">
        <div class="ge-keyline-mini__line1" :class="{ keyline_line1_active: active }"></div>
        <div class="ge-keyline-mini__line2" :class="{ keyline_line2_active: active }"></div>
        <div class="ge-keyline-mini__line3" :class="{ keyline_line1_active: active }"></div>
        <div class="ge-keyline-mini__line4" :class="{ keyline_line2_active: active }"></div>
        <div class="ge-keyline-mini__line5" :class="{ keyline_line3_active: active }"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
    name: 'ge-keyline-mini',
    props: {
        active: {
            type: Boolean,
            default: true,
        },
    },
});
</script>
