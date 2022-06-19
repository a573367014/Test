<template>
    <div class="ge-container-demo">
        <div class="ge-container-demo"></div>
        <div class="ge-container-demo">
            <ge-container>
                <ge-header>Header</ge-header>
                <ge-main>Main</ge-main>
            </ge-container>
        </div>
        <div class="ge-container-demo">
            <ge-container>
                <ge-header>Header</ge-header>
                <ge-main>Main</ge-main>
                <ge-footer>Footer</ge-footer>
            </ge-container>
        </div>
        <div class="ge-container-demo">
            <ge-container>
                <ge-aside width="200px">Aside</ge-aside>
                <ge-main>Main</ge-main>
            </ge-container>
        </div>
        <div class="ge-container-demo">
            <ge-container>
                <ge-header>Header</ge-header>
                <ge-container>
                    <ge-aside width="200px">Aside</ge-aside>
                    <ge-main>Main</ge-main>
                </ge-container>
            </ge-container>
        </div>
        <div class="ge-container-demo">
            <ge-container>
                <ge-header>Header</ge-header>
                <ge-container>
                    <ge-aside width="200px">Aside</ge-aside>
                    <ge-container>
                        <ge-main>Main</ge-main>
                        <ge-footer>Footer</ge-footer>
                    </ge-container>
                </ge-container>
            </ge-container>
        </div>
        <div class="ge-container-demo">
            <ge-container>
                <ge-aside width="200px">Aside</ge-aside>
                <ge-container>
                    <ge-header>Header</ge-header>
                    <ge-main>Main</ge-main>
                </ge-container>
            </ge-container>
        </div>
        <div class="ge-container-demo">
            <ge-container>
                <ge-aside width="200px">Aside</ge-aside>
                <ge-container>
                    <ge-header>Header</ge-header>
                    <ge-main>Main</ge-main>
                    <ge-footer>Footer</ge-footer>
                </ge-container>
            </ge-container>
        </div>
    </div>
</template>

<script>
import { GeContainer, GeAside, GeFooter, GeHeader, GeMain } from '../../../src/';
import '../../../es/components/container/container/style';
import '../../../es/components/container/aside/style';
import '../../../es/components/container/main/style';
import '../../../es/components/container/header/style';
import '../../../es/components/container/footer/style';

export default {
    name: 'test-container',
    components: {
        GeContainer,
        GeAside,
        GeFooter,
        GeHeader,
        GeMain,
    },
};
</script>

<style lang="less">
.ge-container-demo {
    width: 100%;
    height: 100%;
    margin-top: 10px;
}
.ge-header,
.ge-footer {
    background-color: #b3c0d1;
    color: #333;
    text-align: center;
    line-height: 60px;
}

.ge-aside {
    background-color: #d3dce6;
    color: #333;
    text-align: center;
    line-height: 200px;
}

.ge-main {
    background-color: #e9eef3;
    color: #333;
    // text-align: center;
    // line-height: 160px;
}

body > .ge-container {
    margin-bottom: 40px;
}

.ge-container:nth-child(5) .ge-aside,
.ge-container:nth-child(6) .ge-aside {
    line-height: 260px;
}
</style>
