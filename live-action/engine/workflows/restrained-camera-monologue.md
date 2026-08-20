<!-- Generated from data/workflows.json. Do not edit directly. -->

# Restrained Camera Monologue

## 克制镜头独白

A single-performer close shot where voice rhythm, breathing, and eye focus matter more than gestures.

声音节奏、呼吸和视线比手势更重要的单人近景表演。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Performance / 人物表演 |
| Mode | image-to-video |
| Duration | 12s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | intermediate |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Keep the viewer with a difficult thought without adding coverage, music, or theatrical movement.

**中文：** 不增加补充镜头、音乐或戏剧化动作，让观众停留在一个艰难想法上。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | Exact adult identity, wardrobe, chair, background, and eye-line reference. | 成年人物身份、服装、椅子、背景和视线的精确参考。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-4s | Performer looks just beside camera, begins the first short clause, hands still. | 表演者看向镜头旁边，开始第一句短分句，双手不动。 |
| 4-8s | A breath interrupts the sentence; gaze briefly meets lens, then moves away. | 一次呼吸打断句子；视线短暂看镜头后移开。 |
| 8-12s | Finish with a quieter final clause and a held silence, no smile or tear. | 用更轻的最后分句结束并保持沉默；不微笑、不流泪。 |

## Sound / 声音

**EN:** Close natural voice, room tone, clothing movement, no music. Line: 'I kept waiting for it to feel like the right choice. It never did.'

**中文：** 近距离自然人声、室内底噪、轻微衣料声；无音乐。台词：“我一直等它变成一个正确的选择。可它从来没有。”

## Prompt (English)

```text
@Image1 is the exact identity, wardrobe, chair, background, and eye-line reference for one adult performer. Live-action medium close-up, camera locked with an almost invisible breath-like float, practical soft side light, natural skin texture. 0-4s: performer looks just beside camera, hands still, and says, 'I kept waiting for it to feel like the right choice.' 4-8s: one breath interrupts the thought; their eyes briefly meet the lens, then move away. 8-12s: they finish more quietly, 'It never did.' Hold two seconds of silence after the final word. Preserve face, hair, wardrobe, posture, chair, background, and light direction. Voice is close and natural, with room tone and slight clothing movement. No music, no cutaway, no zoom, no hand gesture, no smile, no tears, no subtitles, no beauty retouching, no extra words.
```

## 提示词（中文）

```text
@Image1 是一名成年表演者身份、服装、椅子、背景和视线的精确参考。真人中近景，镜头基本固定，只保留几乎不可见的呼吸式漂移；柔和实景侧光，自然皮肤纹理。0-4 秒：表演者看向镜头旁边，双手不动，说：“我一直等它变成一个正确的选择。” 4-8 秒：一次呼吸打断想法；视线短暂看向镜头，然后移开。8-12 秒：更轻地说：“可它从来没有。” 最后一个字后保持两秒沉默。锁定脸、头发、服装、姿态、椅子、背景和光向。人声近而自然，带室内底噪和轻微衣料声。无音乐、无切景、无变焦、无手势、无微笑、无眼泪、无字幕、无磨皮、无额外台词。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact identity, wardrobe, chair, background, and eye-line reference for one adult performer. Live-action medium close-up, camera locked with an almost invisible breath-like float, practical soft side light, natural skin texture. 0-4s: performer looks just beside camera, hands still, and says, 'I kept waiting for it to feel like the right choice.' 4-8s: one breath interrupts the thought; their eyes briefly meet the lens, then move away. 8-12s: they finish more quietly, 'It never did.' Hold two seconds of silence after the final word. Preserve face, hair, wardrobe, posture, chair, background, and light direction. Voice is close and natural, with room tone and slight clothing movement. No music, no cutaway, no zoom, no hand gesture, no smile, no tears, no subtitles, no beauty retouching, no extra words.",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://restrained-monologue-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是一名成年表演者身份、服装、椅子、背景和视线的精确参考。真人中近景，镜头基本固定，只保留几乎不可见的呼吸式漂移；柔和实景侧光，自然皮肤纹理。0-4 秒：表演者看向镜头旁边，双手不动，说：“我一直等它变成一个正确的选择。” 4-8 秒：一次呼吸打断想法；视线短暂看向镜头，然后移开。8-12 秒：更轻地说：“可它从来没有。” 最后一个字后保持两秒沉默。锁定脸、头发、服装、姿态、椅子、背景和光向。人声近而自然，带室内底噪和轻微衣料声。无音乐、无切景、无变焦、无手势、无微笑、无眼泪、无字幕、无磨皮、无额外台词。",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://restrained-monologue-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Keep hands still and framing unchanged. The emotional arc is carried only by breath, lens contact, and vocal volume.

**中文：** 双手保持不动，构图不变。情绪弧线只由呼吸、短暂看镜头和音量变化承担。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The performer gestures or cries. | Retake performance only: hands still, no tears, one breath and one lens glance. | 表演者挥手或哭泣。 | 只重做表演：双手不动、不流泪，只保留一次呼吸和一次看镜头。 |
| The line runs too fast. | Insert the breath after the first sentence and hold two seconds after the last word; keep framing fixed. | 台词说得太快。 | 在第一句后插入呼吸，最后一字后保持两秒；构图固定。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
