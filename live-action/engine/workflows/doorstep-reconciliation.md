<!-- Generated from data/workflows.json. Do not edit directly. -->

# Doorstep Reconciliation

## 门口和解

A two-person doorstep scene that ends with permission to enter, not a complete emotional resolution.

以允许进门而非彻底和解结束的双人门口场景。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Dialogue Scenes / 对话场景 |
| Mode | image-to-video |
| Duration | 15s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | intermediate |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Turn rejection into a small opening while keeping the relationship unresolved.

**中文：** 把拒绝转为一个小小入口，但关系仍未完全解决。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | First frame with both adults separated by the doorway, wardrobe, bag prop, and porch light. | 包含被门口分隔的两位成年人、服装、包和门廊灯的首帧。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-5s | Visitor stands outside and says one direct line; resident keeps the door partly closed. | 来访者站在门外说一句直接台词；屋内人保持门半关。 |
| 5-10s | Hold on the resident's silent reaction; hand relaxes on the door edge. | 停在屋内人的沉默反应上；扶门的手逐渐放松。 |
| 10-15s | Door opens only one step wider and resident says, 'Five minutes.' Visitor nods once. | 门只再开一步，屋内人说：“五分钟。” 来访者只点头一次。 |

## Sound / 声音

**EN:** Night insects, distant traffic, soft porch-light buzz, two short lines, no score.

**中文：** 夜虫、远处车辆、门廊灯轻微电流声、两句短台词；无配乐。

## Prompt (English)

```text
@Image1 is the exact first frame for both adult identities, wardrobe, bag, doorway geometry, porch light, and inside-outside screen positions. Grounded live-action night scene, practical porch light, restrained acting. 0-5s: the visitor remains outside and says quietly, 'I didn't come to make excuses.' The resident keeps the door partly closed and gives no answer. 5-10s: hold a close reaction on the resident; one breath, eyes lower, fingers relax slightly on the door edge. 10-15s: return to the two-shot; the resident opens the door only one step wider and says, 'Five minutes.' The visitor nods once but does not enter before the cut. Preserve identities, wardrobe, bag, door hinge direction, threshold geography, and light direction. Sound: night insects, distant traffic, porch-light buzz. Exactly two lines. No hug, no crying, no touching, no full door opening, no entry, no score, no subtitles.
```

## 提示词（中文）

```text
@Image1 是两位成年人物身份、服装、包、门口几何、门廊灯和内外画面位置的精确首帧。写实真人夜景，使用实景门廊灯，表演克制。0-5 秒：来访者始终站在门外，轻声说：“我不是来找借口的。” 屋内人保持门半关，不回答。5-10 秒：停在屋内人的近景反应；呼吸一次、视线降低、扶在门边的手指略微放松。10-15 秒：回到双人镜头；屋内人只把门再打开一步，说：“五分钟。” 来访者只点头一次，在切断前不进门。锁定身份、服装、包、门铰链方向、门槛空间和光向。声音：夜虫、远处车辆、门廊灯电流声。严格两句台词。无拥抱、无哭泣、无触碰、不完全开门、不进屋、无配乐、无字幕。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact first frame for both adult identities, wardrobe, bag, doorway geometry, porch light, and inside-outside screen positions. Grounded live-action night scene, practical porch light, restrained acting. 0-5s: the visitor remains outside and says quietly, 'I didn't come to make excuses.' The resident keeps the door partly closed and gives no answer. 5-10s: hold a close reaction on the resident; one breath, eyes lower, fingers relax slightly on the door edge. 10-15s: return to the two-shot; the resident opens the door only one step wider and says, 'Five minutes.' The visitor nods once but does not enter before the cut. Preserve identities, wardrobe, bag, door hinge direction, threshold geography, and light direction. Sound: night insects, distant traffic, porch-light buzz. Exactly two lines. No hug, no crying, no touching, no full door opening, no entry, no score, no subtitles.",
    "duration": 15,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://doorstep-reconciliation-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是两位成年人物身份、服装、包、门口几何、门廊灯和内外画面位置的精确首帧。写实真人夜景，使用实景门廊灯，表演克制。0-5 秒：来访者始终站在门外，轻声说：“我不是来找借口的。” 屋内人保持门半关，不回答。5-10 秒：停在屋内人的近景反应；呼吸一次、视线降低、扶在门边的手指略微放松。10-15 秒：回到双人镜头；屋内人只把门再打开一步，说：“五分钟。” 来访者只点头一次，在切断前不进门。锁定身份、服装、包、门铰链方向、门槛空间和光向。声音：夜虫、远处车辆、门廊灯电流声。严格两句台词。无拥抱、无哭泣、无触碰、不完全开门、不进屋、无配乐、无字幕。",
    "duration": 15,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://doorstep-reconciliation-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** The threshold remains the boundary for the entire clip. The visitor does not cross it, and the door opens only slightly.

**中文：** 门槛全程是边界。来访者不跨过门槛，门只略微打开。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The scene resolves with a hug or entry. | Retake only the ending: one-step door opening, one nod, cut before crossing. | 场景以拥抱或进门解决。 | 只重做结尾：门开一步、点头一次、跨过门槛前切断。 |
| Dialogue expands into an argument. | Keep exactly two short lines and move the emotional work back to the resident's hand and eyes. | 台词扩展成争吵。 | 严格两句短台词，把情绪重新交给屋内人的手和眼神。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
