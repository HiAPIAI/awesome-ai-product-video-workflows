<!-- Generated from data/workflows.json. Do not edit directly. -->

# Morning Kitchen Routine

## 清晨厨房日常

A vertical lifestyle clip built from three small continuous actions instead of a montage of unrelated gestures.

由三个连续小动作构成的竖屏生活片，而不是无关联动作拼贴。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Everyday Life / 生活场景 |
| Mode | image-to-video |
| Duration | 10s |
| Aspect ratio | 9:16 |
| Resolution | 720p |
| Difficulty | starter |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Make an ordinary routine feel observed and tactile without turning it into a glossy advertisement.

**中文：** 让普通日常显得被真实观察且有触感，而不是光鲜广告。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | First-frame identity, kitchen layout, mug, kettle, and morning wardrobe. | 锁定人物身份、厨房布局、杯子、水壶和晨间服装的首帧。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-3s | Subject enters frame, opens the curtain, and lets window light expand naturally. | 人物入画并拉开窗帘，让窗光自然增强。 |
| 3-7s | They pour hot water once; steam catches the side light while the camera drifts closer. | 只倒一次热水；蒸汽被侧光照亮，镜头轻微靠近。 |
| 7-10s | They wrap both hands around the mug and look out of frame, ending on a quiet exhale. | 双手握杯看向画外，以一次安静呼气结束。 |

## Sound / 声音

**EN:** Curtain rings, kettle pour, cup contact, distant street ambience; no music and no speech.

**中文：** 窗帘环、倒水、杯子接触桌面、远处街声；无音乐、无说话。

## Prompt (English)

```text
@Image1 is the exact first frame and identity reference for the adult, kitchen layout, mug, kettle, and morning wardrobe. Vertical 9:16, natural lifestyle realism, eye-level controlled handheld camera with only a slow inward drift. 0-3s: the subject enters the existing frame and opens the curtain in one continuous motion; real window light expands across the counter. 3-7s: they pour hot water once into the same mug; steam catches the side light while the camera moves slightly closer. 7-10s: they set the kettle down, wrap both hands around the mug, and look just off camera, ending on one quiet exhale. Preserve face, hair, clothing, mug color, kettle, counter objects, and window direction. Sound: curtain rings, water pour, cup contact, distant street ambience. No dialogue, no music, no beauty retouching, no product hero shot, no extra food, no jump cuts, no text.
```

## 提示词（中文）

```text
@Image1 是成年人身份、厨房布局、杯子、水壶和晨间服装的精确首帧。竖屏 9:16，自然生活写实，视线高度受控手持，镜头只缓慢向内漂移。0-3 秒：人物进入既有画面，用一个连续动作拉开窗帘，真实窗光逐渐铺到台面。3-7 秒：只向同一个杯子倒一次热水；蒸汽被侧光照亮，镜头略微靠近。7-10 秒：放下水壶，双手握住杯子，看向镜头旁边，以一次安静呼气结束。锁定脸、头发、服装、杯子颜色、水壶、台面物件和窗光方向。声音：窗帘环、倒水、杯子接触、远处街声。无台词、无音乐、无磨皮、无产品英雄镜头、无额外食物、无跳切、无文字。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact first frame and identity reference for the adult, kitchen layout, mug, kettle, and morning wardrobe. Vertical 9:16, natural lifestyle realism, eye-level controlled handheld camera with only a slow inward drift. 0-3s: the subject enters the existing frame and opens the curtain in one continuous motion; real window light expands across the counter. 3-7s: they pour hot water once into the same mug; steam catches the side light while the camera moves slightly closer. 7-10s: they set the kettle down, wrap both hands around the mug, and look just off camera, ending on one quiet exhale. Preserve face, hair, clothing, mug color, kettle, counter objects, and window direction. Sound: curtain rings, water pour, cup contact, distant street ambience. No dialogue, no music, no beauty retouching, no product hero shot, no extra food, no jump cuts, no text.",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "first_frame_url": "asset://morning-kitchen-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是成年人身份、厨房布局、杯子、水壶和晨间服装的精确首帧。竖屏 9:16，自然生活写实，视线高度受控手持，镜头只缓慢向内漂移。0-3 秒：人物进入既有画面，用一个连续动作拉开窗帘，真实窗光逐渐铺到台面。3-7 秒：只向同一个杯子倒一次热水；蒸汽被侧光照亮，镜头略微靠近。7-10 秒：放下水壶，双手握住杯子，看向镜头旁边，以一次安静呼气结束。锁定脸、头发、服装、杯子颜色、水壶、台面物件和窗光方向。声音：窗帘环、倒水、杯子接触、远处街声。无台词、无音乐、无磨皮、无产品英雄镜头、无额外食物、无跳切、无文字。",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "first_frame_url": "asset://morning-kitchen-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** The mug, kettle, window, and subject remain in the same kitchen geometry. Each action flows into the next without resetting hands or props.

**中文：** 杯子、水壶、窗户和人物始终处于同一厨房空间。每个动作自然衔接，不重置手势或道具。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The result looks like a beverage commercial. | Remove hero framing and keep the mug secondary; do not change the action sequence. | 成片像饮品广告。 | 去掉产品英雄构图，让杯子保持次要；动作顺序不变。 |
| Hands or props reset between beats. | Retake with one continuous hand path from kettle to mug to hold; keep camera fixed. | 节拍之间手或道具重置。 | 重做时指定手从水壶到杯子再到握杯的一条连续路径；镜头不改。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
