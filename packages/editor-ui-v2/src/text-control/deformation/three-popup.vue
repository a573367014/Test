<template>
    <div class="eui-v2-deformation-popup">
        <div class="label">{{ $tsl('变形') }}</div>
        <div class="eui-v2-deformation-effects" @scroll="effectsScroll">
            <template v-for="(item, index) in effects.effectInfo">
                <div
                    :key="item.id"
                    class="eui-v2-deformation-popup-effect"
                    :class="[
                        { 'popup-effect-active': item.id === deformation.type },
                        { 'deformation-no-effect': index === 0 },
                    ]"
                    :style="
                        index === 0
                            ? null
                            : {
                                  'background-image': `url(${item.preview.url})`,
                              }
                    "
                    @click="effectClick(item)"
                >
                    <Icon v-if="index === 0" name="no-effect"></Icon>
                </div>

                <div
                    :key="item.name"
                    class="eui-v2-deformation-ajust-panel"
                    v-if="!noNeedAdjust(item) && index === indexShowPanel"
                >
                    <RangePicker
                        v-for="(attr, index) in deformation.attrs"
                        :key="index"
                        :label-width="60"
                        :disabled="deformation.type === 'none'"
                        :label="attr.name"
                        :value="getValue(index)"
                        :min="attr.min"
                        :max="attr.max"
                        :start="attr.start"
                        :suffix="getSuffix(attr)"
                        :inputWidth="34"
                        @change="handleIntensityChange($event, index, attr)"
                    />
                    <eui-v2-button
                        class="eui-v2-deformation-popup__button"
                        v-if="deformation.type === 'arbitraryOffsetRotate-byWord'"
                        @click="generateArbitraryDeformation"
                    >
                        {{ $tsl('随机生成') }}
                    </eui-v2-button>
                    <Select
                        ref="directionSelect"
                        class="deformation-text-direction"
                        classSelect="deformation-select-options"
                        v-if="deformation.isFollowTangent"
                        v-model="element.deformation.isFollowTangent"
                        :appendBody="true"
                        :options="textDirectionList"
                        @change="emitChange"
                        size="middle"
                    >
                        <template #suffix-icon>
                            <Icon name="arrow-down" />
                        </template>
                    </Select>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
/* eslint-disable */
// import Button from '../base/button';
import RangePicker from '../../components/range-picker';
import Select from '../../base/select';
import Icon from '../../base/icon';
import { createDeformations } from './three.js';
import { i18n } from '../../i18n';
import pick from 'lodash/pick';

const reByWord = /-byWord$/;
const extractTextCore = (element) => {
    return pick(element, [
        'autoScale',
        'width',
        'height',
        'top',
        'left',
        'fontSize',
        'letterSpacing',
        'textAlign',
        'fontStyle',
        'fontFamily',
        'content',
        'contents',
        'color',
        'writingMode',
        'transform',
        'textEffects',
        'shadows',
    ]);
};

export default {
    components: {
        Icon,
        Select,
        // Button,
        RangePicker,
    },
    props: {
        element: {
            type: Object,
            required: true,
        },
        editor: {
            type: Object,
            required: true,
        },
    },
    data() {
        const deformations = createDeformations();
        const noDeformation = deformations[0];

        const noDeformationInfo = {
            name: noDeformation.name,
            id: noDeformation.type,
            preview: { url: noDeformation.url },
        };
        return {
            noDeformation,
            noDeformationInfo,
            effects: {
                effectInfo: (() => {
                    const effectInfo = deformations.map((deformation) => ({
                        name: deformation.name,
                        id: deformation.type,
                        isFollowTangent: deformation.isFollowTangent,
                        attrs: deformation.attrs,
                        preview: { url: deformation.url },
                    }));

                    return effectInfo;
                })(),
            },
            textDirectionList: [
                {
                    value: false,
                    name: i18n.$tsl('保持原本方向'),
                },
                {
                    value: true,
                    name: i18n.$tsl('曲线法线方向'),
                },
            ],
            indexShowPanel: -1,
        };
    },

    computed: {
        currentEffect() {
            const { deformation, warpByWord } = this.element;
            if (!warpByWord.enable && deformation.type === 'none') {
                return this.noDeformationInfo;
            } else {
                return this.effects.effectInfo.find((info) => info.id === this.deformation.type);
            }
        },
        deformation() {
            const deformations = createDeformations();
            let deformation = null;
            const type = this.element.warpByWord.enable
                ? this.element.warpByWord.pattern
                : this.element.deformation.type;

            for (let index = 0; index < deformations.length; ++index) {
                const el = deformations[index];
                if (el.type === type || el.pattern === type) {
                    deformation = el;

                    const row = Math.ceil((index + 1) / 3);
                    this.indexShowPanel = row * 3 - 1;
                    break;
                }
            }

            if (this.indexShowPanel >= deformations.length) {
                this.indexShowPanel = deformations.length - 1;
            }

            return deformation;
        },
        isDeformation() {
            return !this.element.warpByWord.enable;
        },
    },

    methods: {
        $tsl: i18n.$tsl,
        noNeedAdjust() {
            const blackList = ['none'];
            return blackList.includes(this.currentEffect.id);
        },

        effectClick(item) {
            if (item.id === 'none') this.$emit('close');
            this.handelTransformSelect(item);
        },

        emitChange() {
            setTimeout(() => {
                this.editor.makeSnapshotByElement(this.element, false, true);
            }, 500);
        },

        getSuffix(attr) {
            const suffix = '';
            if (attr.suffix) {
                return attr.suffix;
            } else if (attr.name === '角度') {
                return '°';
            } else {
                return '';
            }
        },

        getValue(index) {
            const { isDeformation, element } = this;
            const { deformation, warpByWord } = element;
            const key = index === 0 ? 'intensity' : 'intensity1';

            if (isDeformation) {
                return deformation[key];
            } else {
                return warpByWord[key];
            }
        },

        effectsScroll() {
            const { directionSelect } = this.$refs;
            if (directionSelect?.[0]?.$children?.length) {
                directionSelect[0].$children[0].closePopup();
            }
        },

        handelTransformSelect(deformationInfo, idx) {
            const deformations = createDeformations();
            const deformation = deformations.find(({ type }) => type === deformationInfo.id);
            const isDeformation = !reByWord.test(deformationInfo.id);
            const { warpByWord } = this.element;
            const intensity = deformation.attrs?.[0]?.value || 25;
            const intensity1 = deformation.attrs?.[1]?.value || 25;

            if (isDeformation) {
                if (this.element.deformation.type !== deformationInfo.id) {
                    this.element.deformation.type = deformationInfo.id;
                    this.element.deformation.intensity = intensity;
                    this.element.deformation.intensity1 = intensity1;
                }
                warpByWord.enable = false;
            } else {
                // this.element.deformation.type = 'none';
                if (warpByWord.pattern !== deformation.pattern || !warpByWord.enable) {
                    this.element.deformation.type = deformationInfo.id;
                    Object.assign(warpByWord, {
                        enable: true,
                        intensity,
                        intensity1,
                        pattern: deformation.pattern,
                    });
                }
            }

            this.emitChange();
        },

        handleDeformationClear() {
            this.element.deformation.type = 'none';
            this.element.warpByWord.enable = false;
            this.emitChange();
        },

        handleIntensityChange(val, index, attr) {
            const key = index === 0 ? 'intensity' : 'intensity1';
            const { warpByWord, deformation } = this.element;

            if (this.isDeformation) {
                deformation[key] = val;
            } else {
                warpByWord[key] = val;
            }
            this.emitChange();
        },

        generateArbitraryDeformation() {
            this.element.warpByWord.randNum = new Date().getMilliseconds();
            this.emitChange();
        },
    },
};
</script>

<style lang="less">
.eui-v2-deformation-popup {
    width: 252px;
    height: 420px;
    padding: 13px 0;
    background: #ffffff;
    transform: translateX(-55%);

    .label {
        margin-bottom: 14px;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        padding: 0 16px;
        color: #33383e;
    }
    .eui-v2-deformation-effects {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin: -4px;
        width: 100%;
        height: 360px;
        padding-left: 16px;
        overflow-x: hidden;
    }
    .eui-v2-deformation-popup-effect {
        position: relative;
        flex: 1;
        max-width: 68px;
        min-width: 60px;
        height: 68px;
        margin: 4px;
        background-color: #f6f7f9;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        border-radius: 4px;
        box-sizing: border-box;
        cursor: pointer;

        &:hover {
            background-color: darken(#f5f8fc, 1%);
        }

        &.popup-effect-active {
            &:after {
                content: '';
                display: inline-block;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 2px solid #2354f4;
                border-radius: 4px;
            }
        }

        &.deformation-no-effect {
            background-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;

            .eui-v2-icon--no-effect {
                height: 24px;
                width: 24px;
            }
        }
    }

    .eui-v2-deformation-ajust-panel {
        position: relative;
        width: 100%;
        margin-top: 16px;
        margin-bottom: 16px;
        background-color: #fff;
    }

    .eui-v2-range-picker {
        padding-top: 0;
        padding-bottom: 0;
        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }

        .eui-v2-range-picker__label,
        .eui-v2-range-picker__control {
            line-height: 14px;
            padding: 0;
        }
    }

    .deformation-text-direction {
        position: relative;
        padding-top: 0;
        padding-right: 18px;
        padding-bottom: 0;
        border: none;
        font-weight: 500;
        z-index: 33;

        .eui-v2-button {
            font-weight: 500;
            border: none;
        }
        .eui-v2-dropdown-button__suffix {
            right: 0;
            width: 16px;
            height: 16px;
            .eui-v2-icon {
                font-size: 16px;
            }
        }
    }
    .deformation-select-options {
        width: 60%;
        transform: translateX(2px);
    }

    // from others
    .eui-v2-dropdown-effect-preview {
        display: flex;
        height: 50px;

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
        width: 204px;
        height: 32px;
        padding: 7px 0;
        margin: 0 16px;
        background: #f6f7f9;
        border-radius: 4px;
        border: none;
        color: #33383e;
        font-size: 13px;
        font-weight: 500;
        &:hover {
            background-color: #e8eaec;
        }
        &:active {
            color: #33383e;
        }
    }
    &__panel {
        padding: 12px 0;
    }
}
</style>
