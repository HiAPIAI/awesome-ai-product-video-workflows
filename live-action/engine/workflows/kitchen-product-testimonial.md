<!-- Generated from data/workflows.json. Do not edit directly. -->

# Kitchen Product Testimonial

## 厨房产品体验口播

A low-polish UGC testimonial where the product is handled naturally and the claim stays specific.

产品自然被使用、表达具体且不过度包装的低精修 UGC 口播。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Documentary / UGC / 纪实与 UGC |
| Mode | image-to-video |
| Duration | 10s |
| Aspect ratio | 9:16 |
| Resolution | 720p |
| Difficulty | starter |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Build trust through one concrete observation and imperfect creator delivery, not sales pressure.

**中文：** 通过一个具体观察和不完美的创作者表达建立信任，而不是制造销售压力。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | Adult creator identity, kitchen, wardrobe, and generic unbranded product reference. | 成年创作者身份、厨房、服装和通用无品牌产品参考。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-3s | Creator begins mid-thought while using the product, not holding it to camera. | 创作者在使用产品时从半句开始，不把产品举到镜头前。 |
| 3-8s | One concise observation, one natural glance down at the task, then back to lens. | 一句具体观察，先自然看向手中操作，再回看镜头。 |
| 8-10s | Finish with a small shrug and continue the task; no call to action. | 以轻微耸肩结束并继续手中动作；不加行动号召。 |

## Sound / 声音

**EN:** Phone microphone, kitchen room tone, product handling sound, one sentence, no music.

**中文：** 手机麦克风质感、厨房底噪、产品使用声、一句话；无音乐。

## Prompt (English)

```text
@Image1 is the exact reference for the adult creator's identity, hair, casual wardrobe, kitchen layout, and generic unbranded product. Vertical 9:16 creator phone-video realism, waist-up framing, slight handheld correction, natural window light, no studio polish. 0-3s: creator is already using the product on the counter and begins mid-thought, not holding it up: 'What surprised me is...' 3-8s: they continue, '...it is quieter than the one I had, so I actually use it before work.' They glance down once at the task, then back to lens. 8-10s: a small shrug, then they continue using it without a call to action. Preserve face, wardrobe, product shape, counter layout, and hand path. Sound: phone microphone, kitchen room tone, product handling. No brand logo, no price, no discount, no exaggerated claim, no beauty filter, no captions, no music, no product spin, no pointing at screen.
```

## 提示词（中文）

```text
@Image1 是成年创作者身份、发型、休闲服装、厨房布局和通用无品牌产品的精确参考。竖屏 9:16 创作者手机视频质感，腰部以上构图，轻微手持修正，自然窗光，不做棚拍精修。0-3 秒：创作者已经在台面上使用产品，从半句话开始，不把产品举起来：“让我意外的是……” 3-8 秒：继续说：“……它比我之前那个安静，所以我上班前真的会用。” 自然看向手中操作一次，再回看镜头。8-10 秒：轻微耸肩，然后继续使用，不加行动号召。锁定脸、服装、产品形状、台面布局和手部路径。声音：手机麦克风、厨房底噪、产品使用声。无品牌标志、无价格、无折扣、无夸张承诺、无美颜、无字幕、无音乐、无产品旋转、无指向屏幕。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact reference for the adult creator's identity, hair, casual wardrobe, kitchen layout, and generic unbranded product. Vertical 9:16 creator phone-video realism, waist-up framing, slight handheld correction, natural window light, no studio polish. 0-3s: creator is already using the product on the counter and begins mid-thought, not holding it up: 'What surprised me is...' 3-8s: they continue, '...it is quieter than the one I had, so I actually use it before work.' They glance down once at the task, then back to lens. 8-10s: a small shrug, then they continue using it without a call to action. Preserve face, wardrobe, product shape, counter layout, and hand path. Sound: phone microphone, kitchen room tone, product handling. No brand logo, no price, no discount, no exaggerated claim, no beauty filter, no captions, no music, no product spin, no pointing at screen.",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "first_frame_url": "asset://kitchen-testimonial-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是成年创作者身份、发型、休闲服装、厨房布局和通用无品牌产品的精确参考。竖屏 9:16 创作者手机视频质感，腰部以上构图，轻微手持修正，自然窗光，不做棚拍精修。0-3 秒：创作者已经在台面上使用产品，从半句话开始，不把产品举起来：“让我意外的是……” 3-8 秒：继续说：“……它比我之前那个安静，所以我上班前真的会用。” 自然看向手中操作一次，再回看镜头。8-10 秒：轻微耸肩，然后继续使用，不加行动号召。锁定脸、服装、产品形状、台面布局和手部路径。声音：手机麦克风、厨房底噪、产品使用声。无品牌标志、无价格、无折扣、无夸张承诺、无美颜、无字幕、无音乐、无产品旋转、无指向屏幕。",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "first_frame_url": "asset://kitchen-testimonial-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** The product stays in use on the counter and never becomes a floating hero object. Keep one continuous hand path.

**中文：** 产品始终在台面上被使用，不变成悬空英雄物体。保持一条连续手部路径。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The creator turns into a polished salesperson. | Remove the call to action and keep the product in use; preserve the concrete observation. | 创作者变成精修销售员。 | 删除行动号召，让产品继续被使用；保留具体观察。 |
| The product changes shape or floats. | Retake prop continuity only with one counter position and one continuous hand path. | 产品变形或漂浮。 | 只重做道具连续性：固定一个台面位置和一条连续手部路径。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
