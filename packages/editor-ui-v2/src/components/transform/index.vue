<template>
    <div class="three-deformation-attributes">
        <div class="three-section-title">
            <span>{{ $tsl('变形') }}</span>
        </div>
        <Panel>
            <SubPanel hover>
                <DropdownEffects
                    class="three-deformation-attributes__dropdown"
                    :current-effect="currentEffect.id === 'none' ? null : currentEffect"
                    :effects="effects"
                    tooltip
                    @change="handelTransformSelect"
                    @clear="handleDeformationClear"
                >
                    <div slot="preview" class="eui-v2-dropdown-effect-preview">
                        <img
                            class="three-deformation-attributes__preview"
                            :src="currentEffect.preview.url"
                        />
                        <span>{{ currentEffect.name }}</span>
                    </div>
                    <img
                        slot="clear"
                        class="three-deformation-attributes__img"
                        :src="noDeformationInfo.preview.url"
                    />
                </DropdownEffects>
            </SubPanel>
            <SubPanel class="three-deformation-attributes__panel">
                <RangePicker
                    v-for="(attr, index) in deformation.attrs"
                    :key="index"
                    :labelWidth="80"
                    :disabled="deformation.type === 'none'"
                    :label="attr.name"
                    :value="getValue(index)"
                    :min="attr.min"
                    :max="attr.max"
                    :start="attr.start"
                    :suffix="attr.name === '角度' ? '°' : ''"
                    @change="handleIntensityChange($event, index)"
                />
                <Button
                    class="three-deformation-attributes__button"
                    v-if="deformation.type === 'arbitraryOffsetRotate-byWord'"
                    @click="generateArbitraryDeformation"
                >
                    {{ $tsl('随机生成') }}
                </Button>
            </SubPanel>
        </Panel>
    </div>
</template>

<script>
import { get } from 'lodash';
import Panel from '../../base/panel';
import SubPanel from '../../base/sub-panel';
import Button from '../../base/button';
import RangePicker from '../range-picker';
import DropdownEffects from '../dropdown-effects';
import { deformations } from './data';
import { i18n } from '../../i18n';

const noDeformation = deformations[0];
const reByWord = /-byWord$/;

export default {
    components: {
        Panel,
        Button,
        SubPanel,
        RangePicker,
        DropdownEffects,
    },
    inject: ['emitChange'],
    props: {
        element: {
            type: Object,
            required: true,
        },
    },
    data() {
        const noDeformationInfo = {
            name: noDeformation.name,
            id: noDeformation.type,
            preview: { url: noDeformation.url },
        };
        return {
            noDeformation,
            noDeformationInfo,
            effects: {
                effectInfo: deformations.slice(1).map((deformation) => ({
                    name: deformation.name,
                    id: deformation.type,
                    preview: { url: deformation.url },
                })),
            },
        };
    },

    computed: {
        currentEffect() {
            return get(this, 'element.deformation.enable')
                ? this.effects.effectInfo.find((info) => info.id === this.deformation.type)
                : this.noDeformationInfo;
        },
        deformation() {
            let type = 'none';
            if (get(this, 'element.deformation.enable')) {
                type = this.element.deformation.type;
            }
            const deformation = deformations.find((deformation) => deformation.type === type);
            return deformation;
        },
    },

    methods: {
        $tsl: i18n.$tsl,
        getValue(index) {
            return get(this, `element.deformation.intensitys[${index}]`);
        },
        handelTransformSelect(currentEffect) {
            const deformationData = deformations.find(({ type }) => type === currentEffect.id);
            const { deformation } = this.element;

            if (this.deformation.type !== currentEffect.id) {
                const defaultIntensitys = [];
                deformationData.attrs.forEach((attr, index) => {
                    if (attr) {
                        defaultIntensitys[index] = attr.value;
                    }
                });
                if (deformation.type !== currentEffect.id || deformation.enable) {
                    deformation.enable = true;
                    deformation.type = currentEffect.id;
                }
                deformation.intensitys = defaultIntensitys;
            }
        },
        handleDeformationClear() {
            this.element.deformation.enable = false;
        },
        handleIntensityChange(val, index) {
            this.element.deformation.intensitys.splice(index, 1, val);
        },
        generateArbitraryDeformation() {
            this.element.deformation.randNum = new Date().getMilliseconds();
        },
    },
};
</script>

<style lang="less">
.three-deformation-attributes {
    .eui-v2-dropdown-effect-preview {
        display: flex;
        height: 50px;

        align-items: center;

        span {
            margin-left: 12px;
            font-size: 14px;
        }
    }
    &__preview {
        width: 50px;
        border: 1px solid rgba(223, 227, 237, 1);
        border-radius: 4px;
        background: #fff;
    }
    &__img {
        height: 100%;
    }
    &__dropdown {
        border: none;
    }
    &__button {
        margin: 0 auto;
        margin-top: 12px;
        display: block;
        width: 196px;
    }
    &__panel {
        padding: 12px 0;
    }
}
</style>
