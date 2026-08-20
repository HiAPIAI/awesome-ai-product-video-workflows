<!-- Generated from data/workflows.json. Do not edit directly. -->

# Street Interview Answer

## 街头采访回答

A vertical creator-style answer with a believable pause, one concise sentence, and ambient interruptions.

带真实停顿、一句简洁回答和环境干扰的竖屏创作者采访。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Documentary / UGC / 纪实与 UGC |
| Mode | text-to-video |
| Duration | 10s |
| Aspect ratio | 9:16 |
| Resolution | 720p |
| Difficulty | starter |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Feel like an actual captured response, not a polished host script or advertisement.

**中文：** 像真实记录下来的回答，而不是精修主持稿或广告。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `text-only` | yes | No reference required; use an original adult interview subject and generic handheld microphone. | 无需参考；使用原创成年受访者和通用手持麦克风。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-3s | Interviewer asks one short off-camera question; subject thinks before answering. | 采访者在画外问一句短问题；受访者思考后再回答。 |
| 3-8s | Subject answers one sentence with natural eye movement and a small restart. | 受访者用一句话回答，带自然视线变化和一次轻微重启。 |
| 8-10s | A passerby crosses deep background; subject finishes and gives a small nod. | 远处背景有人经过；受访者说完并轻点头。 |

## Sound / 声音

**EN:** Real street ambience, off-camera question, one answer, distant traffic; no music and no crowd cheering.

**中文：** 真实街声、画外问题、一句回答、远处车辆声；无音乐、无人群欢呼。

## Prompt (English)

```text
Vertical 9:16 authentic street interview, handheld phone-camera realism with controlled small movement, one adult interview subject in ordinary clothing, generic unbranded handheld microphone entering from the lower edge. 0-3s: off-camera interviewer asks, 'What changed your mind?' The subject looks aside, takes one breath, and thinks before speaking. 3-8s: subject answers naturally, 'Honestly... I realized I was staying because leaving felt harder.' Include one small restart after 'Honestly,' realistic mouth timing, and subtle eye movement. 8-10s: a passerby crosses only in the deep background; subject finishes and gives one small nod. Keep face, clothing, microphone, street direction, and camera distance stable. Sound: real street ambience and distant traffic. No host in frame, no brand logo, no captions, no beauty filter, no perfect studio audio, no music, no applause, no second answer, no dramatic zoom.
```

## 提示词（中文）

```text
竖屏 9:16 真实街头采访，手机手持质感但小幅受控移动。一名穿普通服装的成年受访者，通用无品牌手持麦克风从画面下缘进入。0-3 秒：画外采访者问：“是什么让你改变了想法？” 受访者看向一旁、呼吸一次、思考后再开口。3-8 秒：受访者自然回答：“说实话……我发现自己留下，只是因为离开更难。” 在“说实话”后保留一次轻微重启，口型时序真实，视线有细小变化。8-10 秒：只有一名路人在远处背景经过；受访者说完并轻点头。锁定脸、服装、麦克风、街道方向和镜头距离。声音：真实街声和远处车辆。主持人不入画、无品牌标志、无字幕、无美颜、无完美棚录音质、无音乐、无掌声、无第二段回答、无戏剧化变焦。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "Vertical 9:16 authentic street interview, handheld phone-camera realism with controlled small movement, one adult interview subject in ordinary clothing, generic unbranded handheld microphone entering from the lower edge. 0-3s: off-camera interviewer asks, 'What changed your mind?' The subject looks aside, takes one breath, and thinks before speaking. 3-8s: subject answers naturally, 'Honestly... I realized I was staying because leaving felt harder.' Include one small restart after 'Honestly,' realistic mouth timing, and subtle eye movement. 8-10s: a passerby crosses only in the deep background; subject finishes and gives one small nod. Keep face, clothing, microphone, street direction, and camera distance stable. Sound: real street ambience and distant traffic. No host in frame, no brand logo, no captions, no beauty filter, no perfect studio audio, no music, no applause, no second answer, no dramatic zoom.",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "竖屏 9:16 真实街头采访，手机手持质感但小幅受控移动。一名穿普通服装的成年受访者，通用无品牌手持麦克风从画面下缘进入。0-3 秒：画外采访者问：“是什么让你改变了想法？” 受访者看向一旁、呼吸一次、思考后再开口。3-8 秒：受访者自然回答：“说实话……我发现自己留下，只是因为离开更难。” 在“说实话”后保留一次轻微重启，口型时序真实，视线有细小变化。8-10 秒：只有一名路人在远处背景经过；受访者说完并轻点头。锁定脸、服装、麦克风、街道方向和镜头距离。声音：真实街声和远处车辆。主持人不入画、无品牌标志、无字幕、无美颜、无完美棚录音质、无音乐、无掌声、无第二段回答、无戏剧化变焦。",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Keep the interviewer off-screen and microphone position stable. Background motion remains secondary to the answer.

**中文：** 采访者始终在画外，麦克风位置稳定。背景运动始终次于回答。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The answer sounds scripted and fluent. | Restore one thinking pause and one small restart; keep the sentence and framing unchanged. | 回答过于流利像背稿。 | 恢复一次思考停顿和一次轻微重启；句子和构图不变。 |
| The background becomes the main event. | Limit background to one distant passerby; preserve subject and audio timing. | 背景抢走主体。 | 背景只保留一名远处路人；主体和声音时序不变。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
