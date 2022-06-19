<style lang="less">
.eui-v2-brand-color-panel {
    user-select: none;
    padding: 0 14px 28px;
    height: 282px;
    overflow: auto;

    &__boards {
        margin-top: 12px;
    }

    &__label {
        color: #8d949e;
        font-size: 12px;
        line-height: 17px;
        margin-bottom: 10px;
    }

    &__grid {
        margin: -3px;
        display: flex;
        flex-wrap: wrap;
    }

    &__item {
        cursor: pointer;
        width: 32px;
        height: 32px;
        margin: 3px;
        border-radius: 4px;
        overflow: hidden;

        background-image: linear-gradient(
                to top right,
                #ccc 25%,
                transparent 25%,
                transparent 75%,
                #ccc 75%,
                #ccc
            ),
            linear-gradient(
                to top right,
                #ccc 25%,
                transparent 25%,
                transparent 75%,
                #ccc 75%,
                #ccc
            );
        background-size: 12px 12px;
        background-position: 0 0, 6px 6px;

        &--white {
            border: 1px solid @border-color;
        }

        &__color {
            width: 100%;
            height: 100%;
        }
    }

    &__dropdown {
        max-height: 200px;
    }

    &__empty {
        padding-top: 42px;
        padding-bottom: 58px;
        text-align: center;
        color: #8d949e;
        font-size: 12px;
        line-height: 17px;

        img {
            width: 72px;
            height: 72px;
            display: block;
            margin: 0 auto;
        }
    }

    .eui-v2-button {
        line-height: 18px;
    }
}
</style>

<template>
    <div class="eui-v2-brand-color-panel">
        <dropdown-button block :loading="teamService.loadingAllBrands">
            {{ brandName }}
            <template #dropdown="dropdown">
                <eui-v2-dropdown-menus class="eui-v2-brand-color-panel__dropdown">
                    <div v-for="team in teams" :key="team.id">
                        <eui-v2-dropdown-menu size="label">
                            {{ team.name }}
                        </eui-v2-dropdown-menu>
                        <div v-for="brand in team.brands" :key="brand.id">
                            <eui-v2-dropdown-menu
                                size="small"
                                :activated="currentBrand && currentBrand.id === brand.id"
                                @click="selectBrand(brand, dropdown)"
                            >
                                {{ brand.name }}
                            </eui-v2-dropdown-menu>
                        </div>
                    </div>
                </eui-v2-dropdown-menus>
            </template>
        </dropdown-button>
        <template v-if="hasColors">
            <div
                class="eui-v2-brand-color-panel__boards"
                v-for="material in colors"
                :key="material.id"
            >
                <div class="eui-v2-brand-color-panel__label">{{ material.name }}</div>
                <div class="eui-v2-brand-color-panel__grid">
                    <div
                        class="eui-v2-brand-color-panel__item"
                        v-for="color in material.data"
                        :key="color"
                        :class="{ 'eui-v2-brand-color-panel__item--white': isWhite(color) }"
                        @click="changeColor(color)"
                    >
                        <div
                            class="eui-v2-brand-color-panel__item__color"
                            :style="getBackgroundColor(color)"
                        />
                    </div>
                </div>
            </div>
        </template>
        <div class="eui-v2-brand-color-panel__empty" v-else>
            <img src="https://st-gdx.dancf.com/assets/20191208-085830-22a2.png" />
            当前品牌暂无调色盘
        </div>
    </div>
</template>

<script>
import DropdownButton from '../dropdown-button';
import tinycolor from 'tinycolor2';
import { i18n } from '../../i18n';

export default {
    components: {
        DropdownButton,
    },
    props: {
        teamService: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            teams: [],
        };
    },
    computed: {
        loading() {
            return this.teamService.loadingTeamsWithBrands;
        },
        hasColors() {
            const { colors } = this;
            return colors.length > 0;
        },
        brandName() {
            const { currentBrand, loading } = this;
            if (loading) {
                return i18n.$tsl('正在加载中...');
            }
            if (!currentBrand) {
                return i18n.$tsl('请选择品牌');
            }

            return currentBrand.name;
        },
        colors() {
            const { currentBrand } = this;
            if (!currentBrand) {
                return [];
            }
            return currentBrand.colors.filter((color) => color.data && color.data.length > 0);
        },
        currentBrand: {
            set(brand) {
                this.teamService.currentBrand = brand;
            },
            get() {
                return this.teamService.currentBrand;
            },
        },
    },
    mounted() {
        this.init();
    },
    methods: {
        init() {
            const { teamService } = this;
            this.teamService.getTeamsWithBrandMaterials(2).then((teams) => {
                const filterTeams = teams.filter((team) => team.brands.length > 0);
                this.teams = filterTeams;
            });
        },
        selectBrand(brand, dropdown) {
            this.currentBrand = brand;
            dropdown.close();
        },
        getBackgroundColor(color) {
            return {
                backgroundColor: color,
            };
        },
        isWhite(color) {
            return tinycolor(color).toHex() === 'ffffff';
        },
        changeColor(color) {
            this.$emit('change', color);
        },
    },
};
</script>
