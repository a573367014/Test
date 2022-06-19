<template>
    <div class="degree-input">
        <div class="degree-input__control">
            <Input
                class="degree-input__control__input"
                :value="degreeStr"
                @focus="onInputFocus"
                @blur="onInputBlur"
            />
        </div>
        <div class="degree-input__panel">
            <div class="degree-input__disk">
                <DegreeDisk v-model="degree" @change="onChange" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from '@vue/composition-api';
import Input from '@gaoding/gd-antd/es/input';
import DegreeDisk from './degree-disk.vue';

/**
 * value(v-model)
 *
 * change
 */
export default defineComponent({
    name: 'ge-degree-input',
    components: {
        Input,
        DegreeDisk,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        value: {
            type: Number,
            default: 0,
        },
    },
    setup(props, { emit }) {
        const degree = ref(props.value);
        let degreeCache = 0;
        const degreeStr = computed(() => {
            return degree.value + '°';
        });
        watch(
            () => props.value,
            (value) => {
                degree.value = value;
            },
        );

        const degreeEnable = (degree: number) => {
            if (Number.isNaN(degree)) return false;
            return degree >= -180 && degree <= 180;
        };
        const onInputFocus = () => {
            degreeCache = degree.value;
        };
        const onInputBlur = (event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            const parsedValue = parseInt(value);
            const filterDegree = degreeEnable(parsedValue) ? parsedValue : degreeCache;
            degree.value = filterDegree;
            (event.target as HTMLInputElement).value = filterDegree + '°';
            emit('change', filterDegree);
        };
        const onChange = (degree: number) => {
            emit('change', degree);
        };
        return {
            degree,
            degreeStr,
            onChange,
            onInputFocus,
            onInputBlur,
        };
    },
});
</script>
