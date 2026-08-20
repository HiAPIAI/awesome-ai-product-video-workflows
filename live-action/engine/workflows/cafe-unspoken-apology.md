<!-- Generated from data/workflows.json. Do not edit directly. -->

# Cafe Unspoken Apology

## 咖啡馆未说出口的道歉

A two-person dialogue scene where the apology lands through a failed sentence and the listener's reaction.

道歉通过一句没说完的话和倾听者反应落地的双人对话场景。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Dialogue Scenes / 对话场景 |
| Mode | image-to-video |
| Duration | 12s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | intermediate |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Let silence and a small gesture carry more weight than a complete explanatory speech.

**中文：** 让沉默和小动作比完整解释性台词更有重量。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | First frame with both adults, table, cups, wardrobe, and eyeline geography. | 包含两位成年人、桌子、杯子、服装和视线空间的首帧。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-4s | Single on the speaker: fingers tighten around the cup; they begin one short line. | 说话者单人镜头：手指握紧杯子，开始一句短台词。 |
| 4-8s | Cut to listener before the line finishes; hold a restrained reaction and one blink. | 台词未说完就切到倾听者，保持克制反应和一次眨眼。 |
| 8-12s | Return to a wider two-shot as the speaker slides the cup away and gives up finishing the sentence. | 回到较宽双人镜头，说话者把杯子推开，放弃说完。 |

## Sound / 声音

**EN:** Low cafe room tone, cup ceramic scrape, line: 'I should have...' then silence.

**中文：** 低咖啡馆底噪、陶瓷杯摩擦；台词：“我那时候应该……”随后沉默。

## Prompt (English)

```text
@Image1 is the exact first frame for both adult identities, wardrobe, table, cups, seating, and eyelines. Grounded live-action cafe dialogue, restrained acting, practical window light, natural skin. 0-4s: clean medium single on the speaker; their fingers tighten once around the cup and they say quietly, 'I should have...' 4-8s: cut to the listener before the sentence finishes; hold the listener's face, one blink, a small jaw shift, no reply. 8-12s: cut back to a wider two-shot; the speaker slides the cup a few centimeters away and stops trying to finish. Keep dialogue exactly one incomplete line. Preserve faces, clothing, cup positions, left-right eyelines, window direction, and table geography. Sound: low cafe room tone and one ceramic scrape. No score, no crying, no hand holding, no reconciliation hug, no subtitles, no background face duplication, no lip movement after the line ends.
```

## 提示词（中文）

```text
@Image1 是两位成年人物身份、服装、桌子、杯子、座位和视线关系的精确首帧。写实真人咖啡馆对话，表演克制，使用真实窗光和自然皮肤。0-4 秒：说话者干净中景单人镜头，手指只握紧杯子一次，轻声说：“我那时候应该……” 4-8 秒：句子未说完就切到倾听者；停留在对方脸上，只出现一次眨眼和轻微下颌变化，不回答。8-12 秒：切回较宽双人镜头；说话者把杯子推开几厘米，放弃说完。台词严格只有这一句未完成的话。锁定脸、服装、杯子位置、左右视线、窗光方向和桌面空间。声音只有低咖啡馆底噪和一次陶瓷摩擦。无配乐、不哭、不牵手、不拥抱和解、无字幕、无背景变脸、台词结束后不再动嘴。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact first frame for both adult identities, wardrobe, table, cups, seating, and eyelines. Grounded live-action cafe dialogue, restrained acting, practical window light, natural skin. 0-4s: clean medium single on the speaker; their fingers tighten once around the cup and they say quietly, 'I should have...' 4-8s: cut to the listener before the sentence finishes; hold the listener's face, one blink, a small jaw shift, no reply. 8-12s: cut back to a wider two-shot; the speaker slides the cup a few centimeters away and stops trying to finish. Keep dialogue exactly one incomplete line. Preserve faces, clothing, cup positions, left-right eyelines, window direction, and table geography. Sound: low cafe room tone and one ceramic scrape. No score, no crying, no hand holding, no reconciliation hug, no subtitles, no background face duplication, no lip movement after the line ends.",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://cafe-apology-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是两位成年人物身份、服装、桌子、杯子、座位和视线关系的精确首帧。写实真人咖啡馆对话，表演克制，使用真实窗光和自然皮肤。0-4 秒：说话者干净中景单人镜头，手指只握紧杯子一次，轻声说：“我那时候应该……” 4-8 秒：句子未说完就切到倾听者；停留在对方脸上，只出现一次眨眼和轻微下颌变化，不回答。8-12 秒：切回较宽双人镜头；说话者把杯子推开几厘米，放弃说完。台词严格只有这一句未完成的话。锁定脸、服装、杯子位置、左右视线、窗光方向和桌面空间。声音只有低咖啡馆底噪和一次陶瓷摩擦。无配乐、不哭、不牵手、不拥抱和解、无字幕、无背景变脸、台词结束后不再动嘴。",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://cafe-apology-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Protect shot-reverse-shot eyelines and cup positions. The listener never speaks; the line stays incomplete.

**中文：** 保护正反打视线和杯子位置。倾听者始终不说话；台词始终未完成。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The speaker completes a long apology. | Retake audio/dialogue only: keep exactly 'I should have...' and cut away before completion. | 说话者完成了长篇道歉。 | 只重做声音/台词：严格保留“我那时候应该……”，未说完就切走。 |
| The listener overacts or cries. | Limit reaction to one blink and jaw shift; preserve all edit timing. | 倾听者过度表演或哭泣。 | 反应只保留一次眨眼和下颌变化；剪辑时序不变。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
