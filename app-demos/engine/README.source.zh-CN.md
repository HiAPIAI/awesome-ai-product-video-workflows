# Awesome AI App Demo Video Workflows

![从应用界面到经人工审核的产品演示视频](assets/cover.svg)

一组开放、可复现的工作流，用应用截图或导出的 UI 原型状态制作产品演示视频。关键产品界面始终由本地确定性图层渲染；可选的 HiAPI 生成能力只用于背景、片头、转场和片尾等非关键图层。

[English](README.md) · [安装与环境](docs/setup.md) · [创作指南](docs/authoring.md) · [Schema 参考](docs/schema-reference.md) · [渲染验收矩阵](docs/acceptance-matrix.md) · [HiAPI 安全说明](docs/hiapi-safety.md)

> 集成状态：`demo-v1`、`compiled-demo-v1` 契约和 CLI 名称已经冻结。核心与渲染分支完成集成、且每个完整视频通过人工审核前，下列示例均保持 `spec-only`，不代表已经验证渲染结果。

## 工作流目录

| 工作流 | 画幅 | 时长 | 演示重点 | 状态 |
| --- | --- | ---: | --- | --- |
| [SaaS 功能发布](examples/saas-feature-launch/) | 16:9、9:16 | 11 秒 | 产品上下文、关键交互、可量化结果 | `spec-only` |
| [移动端 Onboarding](examples/mobile-onboarding/) | 9:16 | 10 秒 | 欢迎、偏好设置、首次价值 | `spec-only` |
| [AI 工作流演示](examples/ai-workflow-demo/) | 16:9 | 12 秒 | 结构化输入、执行过程、人工审核结果 | `spec-only` |
| [Before / After 对比](examples/before-after-comparison/) | 16:9、9:16 | 8 秒 | 使用相同内容和构图做诚实对比 | `spec-only` |
| [9:16 社媒功能短片](examples/vertical-social-feature/) | 9:16 | 7 秒 | 一个钩子、一次交互、一个结果 | `spec-only` |

机器可读目录位于 [`data/workflows.json`](data/workflows.json)。每个示例都包含原创虚构产品截图、`demo.yaml`、预期节奏和完整视频审核清单。

## 快速开始

需要 Node.js 20.18 或更高版本、FFmpeg 和 FFprobe。

```bash
npm ci
npm run doctor -- --strict
npm run validate -- examples/saas-feature-launch/demo.yaml
npm run compile -- examples/saas-feature-launch/demo.yaml --out-dir outputs/saas-feature-launch
npm run render -- --compiled outputs/saas-feature-launch/compiled-demo-v1.json --out-dir outputs/saas-feature-launch
```

生成文件应放在已忽略的 `outputs/` 目录，禁止提交到仓库。环境检查见[安装与环境](docs/setup.md)，完整制作流程见[创作指南](docs/authoring.md)。

## 冻结的 CLI 契约

```text
doctor [--strict]
validate <demo.yaml>
compile <demo.yaml> --out-dir <directory>
render --compiled <compiled-demo-v1.json> --out-dir <directory>
generate --request <hiapi-request.json> --out-dir <directory> [--confirm-preflight <token>]
```

渲染器只消费编译后的 JSON，不会单独重新解释 YAML。验证、编译和本地渲染默认离线。除非用户明确确认当前 preflight token，否则 `generate` 必须保持 dry-run。

## 可选的 HiAPI 增强

HiAPI 可以增强非关键视觉图层，但绝不能重绘产品 UI、文字、光标、标注、指标或其他用于证明产品行为的内容。发起任何付费请求前，先阅读 [HiAPI 安全说明](docs/hiapi-safety.md)。

- [了解 HiAPI](https://www.hiapi.ai/en?utm_source=github&utm_medium=readme-zh&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=home)
- [注册账号](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme-zh&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=register)
- [创建 API Key](https://www.hiapi.ai/en/dashboard/api-keys?utm_source=github&utm_medium=readme-zh&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=api-key)
- [查看 Seedance 2.0 模型](https://www.hiapi.ai/en/models/seedance-2-0?utm_source=github&utm_medium=readme-zh&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=seedance-model)
- [阅读 API 文档](https://docs.hiapi.ai/?utm_source=github&utm_medium=readme-zh&utm_campaign=awesome-ai-app-demo-video-workflows&utm_content=api-docs)

## 参与贡献

提交 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。只接受原创或授权清晰的素材。禁止提交客户截图、凭据、签名 URL、任务日志和渲染二进制文件。

仓库采用 MIT 许可证，第三方与媒体说明见 [NOTICE.md](NOTICE.md)。
