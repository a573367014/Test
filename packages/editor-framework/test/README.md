# 使用编辑器自动化测试工具

VPE 的自动化测试工具能将用户交互行为编写为语义化、结构化、可回放的用例，实现高效的编辑器 TDD 开发工作流。

## 上手使用

```sh
$ cd packages/editor-framework/test

# 本地可视化开发模式
$ npx cypress@9 open-ct

# headless 模式执行用例
$ npx cypress@9 run-ct
```

在 Cypress 受控浏览器中，另可访问 http://localhost:3000/\_\_cypress/src/pages/basic.html 作为不使用测试工具的本地 demo 页。

## 使用测试套件

通过封装 TestRuntime，当前 specs 目录下的测试用例代码均不直接依赖 Cypress，以便于后续优化与自定义扩展。其功能主要分几部分：

- 编辑器实例挂载
- 用户交互模拟
- 测试结果断言

> 项目迭代中，API 可参见已有用例与相关 TS 类型定义。

## 常见问题与注意事项

- 测试执行过程中，在测试区域内的鼠标 hover 可能干扰测试结果。
- 若要操作测试页中的 JS 环境，应在受控浏览器控制台中切换到最后一个 iframe。
- 建议关闭受控浏览器控制台中的 warning 级日志。
- Vue Devtools 等浏览器插件仅在独立 demo 页中方可使用。
