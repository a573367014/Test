<template>
    <div>
        <div
            class="code-box"
            :class="{ hover: hovering, isExpanded: isExpanded }"
            @mouseenter="hovering = true"
            @mouseleave="hovering = false"
        >
            <div class="wrap">
                <div class="source">
                    <component v-if="demo" :is="demo" v-bind="attrs" />
                </div>
            </div>
        </div>
        <div class="code-box-control">
            <div class="code-box__btn" @click="isExpanded = !isExpanded">{{ controlText }}</div>
        </div>
        <div ref="meta" class="language-markup">
            <pre class="highlight"><code v-html="content"></code></pre>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import prism from 'prismjs';
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
});
let id = 0;
export default {
    name: 'code-box',
    components: {
        // VueMarkdown,
    },
    props: {
        name: String,
        title: {
            type: String,
            default: '',
        },
        attrs: {
            type: Object,
            default() {
                return {};
            },
        },
    },
    provide: {
        globalStore: {
            unReadMessageCount: 0,
        },
    },
    data() {
        return {
            hovering: false,
            isExpanded: false,
            id: '',
        };
    },
    computed: {
        demo() {
            return this.name;
        },
        content() {
            return prism.highlight(
                md.render(this.$options.sourceCodeMap[this.name].replace(/\n\n/g, '\n')),
                prism.languages.markup,
                'markup',
            );
        },
        controlText() {
            return this.isExpanded ? '隐藏代码' : '显示代码';
        },
        codeAreaHeight() {
            return this.$el.getElementsByClassName('highlight')[0].clientHeight;
        },
    },
    watch: {
        isExpanded(val) {
            this.$refs.meta.style.height = val ? `${this.codeAreaHeight + 1}px` : '0px';
        },
    },
};
</script>

<style lang="less">
.code-box {
    margin-top: 36px;
    border: solid 1px #eaeefb;
    border-radius: 8px;
    transition: 0.2s;
    code {
        font-family: Menlo, Monaco, Consolas, Courier, monospace;
    }
    .wrap {
        padding: 12px 24px;
        min-height: 40px;
        position: relative;
    }
    &.isExpanded {
        .meta {
            opacity: 1;
        }
    }
    div[class*='language-'] pre {
        margin: 0;
    }
}

.code-box-control {
    padding: 12px 8px;
    text-align: right;
}

.code-box__btn {
  cursor: pointer;
  color: rgb(54, 74, 250);
}

.language-markup {
    transition: 0.5s;
    height: 0px;
    overflow: hidden;
}
</style>
