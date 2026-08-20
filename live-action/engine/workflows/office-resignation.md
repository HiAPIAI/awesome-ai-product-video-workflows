<!-- Generated from data/workflows.json. Do not edit directly. -->

# Office Resignation Turn

## 办公室辞职反转

A vertical two-person micro-drama with a first-two-second hook and an unanswered final reveal.

前两秒钩子加未解答结尾揭示的竖屏双人微短剧。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Dialogue Scenes / 对话场景 |
| Mode | image-to-video |
| Duration | 12s |
| Aspect ratio | 9:16 |
| Resolution | 720p |
| Difficulty | advanced |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Open on the decision, not the setup, and end on a new question rather than resolving the conflict.

**中文：** 从决定本身开场，不做铺垫；以新问题结束，而不是解决冲突。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | First-frame reference with both adults, desk, resignation envelope, wardrobe, and vertical face-safe framing. | 包含两位成年人、办公桌、辞职信封、服装和竖屏面部安全构图的首帧。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-2s | Cold open: employee places the envelope down and says, 'I'm done.' | 冷开场：员工放下信封并说：“我不干了。” |
| 2-8s | Clean reverse single on the manager, then back to the employee; one short reply each. | 经理干净反打，再回员工；每人只说一句短话。 |
| 8-12s | Manager slides a photo partly from a folder; hold the employee's frozen reaction and cut. | 经理从文件夹里推出现半张照片；停在员工僵住的反应上并切断。 |

## Sound / 声音

**EN:** Envelope slap, restrained office room tone, three short lines total, no melodramatic score.

**中文：** 信封落桌声、克制办公室底噪、总共三句短台词；无煽情配乐。

## Prompt (English)

```text
@Image1 is the exact first frame for both adult identities, wardrobe, desk, office layout, resignation envelope, and vertical 9:16 eyelines. Grounded short-form drama, faces large in frame, restrained performance. 0-2s cold open: the employee places the envelope firmly on the desk and says, 'I'm done.' 2-5s: clean reverse medium close-up on the manager, who replies, 'You picked today?' 5-8s: return to the employee; after one breath they say, 'You knew why.' 8-12s: back to the manager, who silently slides a folder forward and reveals only half of a photograph. Cut immediately to the employee's frozen reaction before the photo is explained. Preserve identities, wardrobe, desk objects, left-right eyelines, envelope position, and vertical face-safe framing. Sound: envelope impact, office room tone, three lines only. No yelling, no tears, no pointing, no extra dialogue, no subtitle, no full photo reveal, no resolution.
```

## 提示词（中文）

```text
@Image1 是两位成年人物身份、服装、办公桌、办公室布局、辞职信封和竖屏 9:16 视线关系的精确首帧。写实微短剧，人物脸在画面中足够大，表演克制。0-2 秒冷开场：员工把信封坚定放在桌上，说：“我不干了。” 2-5 秒：经理中近景干净反打，回答：“偏偏选今天？” 5-8 秒：回到员工，呼吸一次后说：“你明知道为什么。” 8-12 秒：回到经理，经理不说话，把文件夹推向前，只露出半张照片。在照片得到解释前立刻切到员工僵住的反应。锁定身份、服装、桌面物件、左右视线、信封位置和竖屏面部安全构图。声音：信封落桌、办公室底噪、严格三句台词。无喊叫、无哭泣、无指人、无额外台词、无字幕、不完整展示照片、不解决冲突。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact first frame for both adult identities, wardrobe, desk, office layout, resignation envelope, and vertical 9:16 eyelines. Grounded short-form drama, faces large in frame, restrained performance. 0-2s cold open: the employee places the envelope firmly on the desk and says, 'I'm done.' 2-5s: clean reverse medium close-up on the manager, who replies, 'You picked today?' 5-8s: return to the employee; after one breath they say, 'You knew why.' 8-12s: back to the manager, who silently slides a folder forward and reveals only half of a photograph. Cut immediately to the employee's frozen reaction before the photo is explained. Preserve identities, wardrobe, desk objects, left-right eyelines, envelope position, and vertical face-safe framing. Sound: envelope impact, office room tone, three lines only. No yelling, no tears, no pointing, no extra dialogue, no subtitle, no full photo reveal, no resolution.",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "first_frame_url": "asset://office-resignation-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是两位成年人物身份、服装、办公桌、办公室布局、辞职信封和竖屏 9:16 视线关系的精确首帧。写实微短剧，人物脸在画面中足够大，表演克制。0-2 秒冷开场：员工把信封坚定放在桌上，说：“我不干了。” 2-5 秒：经理中近景干净反打，回答：“偏偏选今天？” 5-8 秒：回到员工，呼吸一次后说：“你明知道为什么。” 8-12 秒：回到经理，经理不说话，把文件夹推向前，只露出半张照片。在照片得到解释前立刻切到员工僵住的反应。锁定身份、服装、桌面物件、左右视线、信封位置和竖屏面部安全构图。声音：信封落桌、办公室底噪、严格三句台词。无喊叫、无哭泣、无指人、无额外台词、无字幕、不完整展示照片、不解决冲突。",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "first_frame_url": "asset://office-resignation-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Keep the envelope fixed after the cold open and reveal only half the photo. The edit axis never crosses.

**中文：** 冷开场后信封位置固定，照片只露出一半。剪辑轴线始终不跨越。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The opening spends time establishing the office. | Retake only the first two seconds: start on the envelope impact and first line. | 开场花时间交代办公室。 | 只重做前两秒：从信封落桌和第一句台词直接开始。 |
| The photo or conflict is fully explained. | Hide half the photo and end on reaction; remove all added explanation. | 照片或冲突被完整解释。 | 遮住半张照片并停在反应上；删掉所有新增解释。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
