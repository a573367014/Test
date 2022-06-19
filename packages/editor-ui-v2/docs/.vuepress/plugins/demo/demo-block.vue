<template>
    <div
        class="demo-block"
        :class="{ 'hover': hovering, 'isExpanded': isExpanded }"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false">
        <div class="wrap">
            <div class="source">
                <component v-if="demo" :is="demo"/>
            </div>
        </div>
        <div class="meta" ref="meta">
            <div class="highlight">
                <slot name="highlight"/>
            </div>
        </div>
        <div
            class="demo-block-control"
            ref="control"
            @click="isExpanded = !isExpanded">
            <div class="description" v-if="$slots.desc">
                <slot name="desc"/>
            </div>
              <span>{{ controlText }}</span>
        </div>
    </div>
</template>


<script>
import Vue from 'vue';
  let id = 0;

  export default {
    name: 'demo-block',
    props: {
        vue: String,
    },
    data() {
      return {
        hovering: false,
        isExpanded: false,
        id: '',
        demo: null,
      }
    },
    computed: {
      controlText() {
        return this.isExpanded ? '隐藏代码' : '显示代码';
    },
      codeArea() {
        return this.$el.getElementsByClassName('meta')[0];
      },
      codeAreaHeight() {
        if (this.$el.getElementsByClassName('description').length > 0) {
          return Math.max(this.$el.getElementsByClassName('description')[0].clientHeight, this.$el.getElementsByClassName('highlight')[0].clientHeight);
        }
        return this.$el.getElementsByClassName('highlight')[0].clientHeight;
      },
    },
    watch: {
      isExpanded(val) {
        this.codeArea.style.height = val ? `${ this.codeAreaHeight + 1 }px` : '0';
      }
    },
    mounted() {
      const component = (new Function(this.vue))();

      if (component && !component.name) {
        component.name = `example-${id += 1}`;
      }
      this.demo = component;
    },
  };
</script>


<style lang="less">
.demo-block {
    margin-top: 16px;
    border: solid 1px #eaeefb;
    border-radius: 4px;
    transition: 0.2s;
    &.hover {
        box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6),
            0 2px 4px 0 rgba(232, 237, 250, 0.5);
    }
    code {
        font-family: Menlo, Monaco, Consolas, Courier, monospace;
    }
    .wrap {
        padding: 24px;
        min-height: 40px;
        position: relative;
    }
    .meta {
        background-color: #fafafa;
        overflow: hidden;
        height: 0;
        transition: all .35s;
        opacity: 0;
    }

    &.isExpanded {
      .meta {
        opacity: 1;
      }
    }

    .description {
        padding: 20px;
        box-sizing: border-box;
        border-radius: 3px;
        font-size: 14px;
        line-height: 22px;
        color: #666;
        word-break: break-word;
        background-color: #fff;
        text-align: left;
    }

    .demo-block-control {
        border-top: solid 1px #eaeefb;
        box-sizing: border-box;
        background-color: #fff;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        text-align: center;
        margin-top: -1px;
        cursor: pointer;
        transition: 0.2s;
        position: relative;
        &.is-fixed {
            position: fixed;
            bottom: 0;
            width: 868px;
        }
        i {
            font-size: 12px;
            line-height: 36px;
            transition: 0.3s;
            &.hovering {
                transform: translateX(-40px);
            }
        }
        span {
            font-size: 14px;
            line-height: 36px;
            transition: 0.3s;
            display: inline-block;
            color: #005cf9;
            &:hover {
                color: #337dfa;
            }
        }
    }

    div[class*="language-"] pre {
      margin: 0;
    }
}
</style>
