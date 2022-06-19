<style lang="less">

</style>

<template>
    <div>
        <Loading
            v-for="element in loadingService.elements"
            :key="element.$id"
            :element="element"
            :editor="editor"/>
    </div>
</template>

<script>
import Loading from './loadng';
import { loadingService } from './loading-service';

export default {
    loadingService,
    components: {
        Loading
    },
    props: {
        editor: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            loadingService
        };
    },
    mounted() {

    }
};
</script>
