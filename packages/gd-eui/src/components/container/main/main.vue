<template>
    <main class="ge-main">
        <slot></slot>
    </main>
</template>
<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
    name: 'GeMain',
});
</script>
