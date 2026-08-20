<!-- Generated from data/workflows.json. Do not edit directly. -->

# Night Corridor Suspense

## 夜间走廊悬念

A one-person suspense beat driven by practical lights turning off behind the subject.

由人物身后实景灯逐盏熄灭推动的单人悬念镜头。

## Verified Render Evidence / 真实生成证据

- Task: `tk-hiapi-01KYGVD8JHJVDPN00CDMSWKGCB`
- Tested: 2026-07-27T03:59:05.000Z
- Prompt (en) SHA-256: `6235d5e4edd1a753223a47e9b3ccb61f4b6a919728bce8b320470a9eb76aee1c`
- Artifact: 8.04s, 1280×720, 24 fps, H.264/AAC
- Artifact SHA-256: `db8f9fcdce815e0ebac6de483a016a50c8c7e43773e5d98523a75470f2df3048`
- Review: partial-pass

**EN:** The revised prompt prevents a global exposure drop: one central ceiling light switches off independently around 3.25-3.5 seconds while the side lights remain stable. A second distinct light switch-off is still not visible, so the two-step sequence remains only partially satisfied.

**中文：** 修改后的提示词避免了整体曝光骤降：约 3.25-3.5 秒一盏中央顶灯独立熄灭，侧灯保持稳定；但仍未看到第二盏灯单独熄灭，因此两步灯光节拍仍只达到部分要求。

| Field | Value |
| --- | --- |
| Category | Cinematic Shots / 电影镜头 |
| Mode | text-to-video |
| Duration | 8s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | starter |
| Render status | Verified render (partial-pass) / 已实测（部分通过） |

## Directorial Intent / 导演意图

**EN:** Create dread through spatial change behind the actor, not through a visible threat or jump scare.

**中文：** 通过演员身后的空间变化制造恐惧，不展示威胁，也不使用突发惊吓。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `text-only` | yes | No reference asset required; keep the subject description generic and original. | 无需参考素材；人物描述保持原创且通用。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-3s | Rear medium tracking shot as an adult walks down a narrow apartment corridor. | 成年人物走过狭窄公寓走廊，镜头从后方中景跟随。 |
| 3-4s | Only the nearest visible ceiling light behind the walker switches off; every other light stays unchanged. | 只有人物身后最近的一盏可见顶灯熄灭；其他灯光保持不变。 |
| 4-6s | After a clearly visible pause, only the second farther light switches off; there is no global dimming. | 经过清晰可见的停顿后，只有更远的第二盏灯熄灭；画面不得整体变暗。 |
| 6-8s | The subject stops without turning; camera stops half a beat later and holds. | 人物停下但不回头；镜头晚半拍停住并保持。 |

## Sound / 声音

**EN:** Fluorescent hum, soft footsteps, two separate relay clicks with at least one second of room tone between them; no music, no voice.

**中文：** 荧光灯电流声、轻脚步、两次分开的继电器咔哒声，中间至少保留一秒环境声；无音乐、无人声。

## Prompt (English)

```text
Grounded live-action suspense in a narrow apartment corridor at night. One adult in ordinary dark outerwear walks away from camera. Rear medium tracking shot at shoulder height, slow and stable, no dramatic lens distortion. 0-3s: follow the subject past practical ceiling lights; natural footsteps and fluorescent hum. 3-4s: only the nearest visible ceiling light behind the subject switches fully off with one small relay click; all other lights, exposure, and wall brightness remain unchanged. 4-6s: preserve a clearly visible pause of at least one second, then only the second farther ceiling light switches fully off with a separate relay click. Do not fade the whole frame and do not switch both lights together. The subject keeps the same pace and does not react theatrically. 6-8s: the subject stops without turning around. The camera stops half a beat later and holds on the dark space behind them. Real walls, real skin, subtle breathing, restrained exposure. No visible attacker, no shadow figure, no jump scare, no whip pan, no text, no score, no flicker beyond the two specified lights.
```

## 提示词（中文）

```text
写实真人悬念片，夜间狭窄公寓走廊。一名穿普通深色外套的成年人背对镜头行走。肩高后方中景稳定跟拍，速度缓慢，不使用夸张广角。0-3 秒：跟随人物经过实景顶灯，只听自然脚步和荧光灯电流声。3-4 秒：只有人物身后最近的一盏可见顶灯完全熄灭，并伴随一次轻微继电器咔哒声；其他灯、曝光和墙面亮度全部保持不变。4-6 秒：保留至少一秒清晰可见的间隔，然后只有更远的第二盏顶灯完全熄灭，并伴随另一次独立的咔哒声。不要让整个画面渐暗，也不要让两盏灯同时熄灭。人物保持原速度，不做戏剧化反应。6-8 秒：人物停下但不回头，镜头晚半拍停住，保持在其身后的黑暗空间。真实墙面、真实皮肤、轻微呼吸、克制曝光。不要展示袭击者、黑影或鬼脸，不要突发惊吓、甩镜、文字、配乐，也不要让指定两盏灯之外的画面闪烁。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "Grounded live-action suspense in a narrow apartment corridor at night. One adult in ordinary dark outerwear walks away from camera. Rear medium tracking shot at shoulder height, slow and stable, no dramatic lens distortion. 0-3s: follow the subject past practical ceiling lights; natural footsteps and fluorescent hum. 3-4s: only the nearest visible ceiling light behind the subject switches fully off with one small relay click; all other lights, exposure, and wall brightness remain unchanged. 4-6s: preserve a clearly visible pause of at least one second, then only the second farther ceiling light switches fully off with a separate relay click. Do not fade the whole frame and do not switch both lights together. The subject keeps the same pace and does not react theatrically. 6-8s: the subject stops without turning around. The camera stops half a beat later and holds on the dark space behind them. Real walls, real skin, subtle breathing, restrained exposure. No visible attacker, no shadow figure, no jump scare, no whip pan, no text, no score, no flicker beyond the two specified lights.",
    "duration": 8,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "写实真人悬念片，夜间狭窄公寓走廊。一名穿普通深色外套的成年人背对镜头行走。肩高后方中景稳定跟拍，速度缓慢，不使用夸张广角。0-3 秒：跟随人物经过实景顶灯，只听自然脚步和荧光灯电流声。3-4 秒：只有人物身后最近的一盏可见顶灯完全熄灭，并伴随一次轻微继电器咔哒声；其他灯、曝光和墙面亮度全部保持不变。4-6 秒：保留至少一秒清晰可见的间隔，然后只有更远的第二盏顶灯完全熄灭，并伴随另一次独立的咔哒声。不要让整个画面渐暗，也不要让两盏灯同时熄灭。人物保持原速度，不做戏剧化反应。6-8 秒：人物停下但不回头，镜头晚半拍停住，保持在其身后的黑暗空间。真实墙面、真实皮肤、轻微呼吸、克制曝光。不要展示袭击者、黑影或鬼脸，不要突发惊吓、甩镜、文字、配乐，也不要让指定两盏灯之外的画面闪烁。",
    "duration": 8,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** The corridor layout, walking direction, exposure, and unaffected lights never change. Only the two named rear fixtures switch off separately; the actor never turns around.

**中文：** 走廊布局、行走方向、曝光和未指定灯光始终不变。只有身后指定的两盏灯分别熄灭；演员始终不回头。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| A monster or shadow appears. | Retake with the explicit rule: threat remains off-screen; preserve every other beat. | 画面出现怪物或黑影。 | 重做时只增加一条：威胁始终在画外；其余节拍保持。 |
| The actor overreacts. | Replace the reaction with a stop and one held breath; keep camera and light timing unchanged. | 演员反应过度。 | 把反应改为停步和一次屏息；镜头与灯光时序不变。 |
| Both lights switch off together or the whole corridor dims. | Retake only the lighting beat: isolate the nearest fixture in 3-4s, hold every other light unchanged for one second, then isolate the farther fixture in 4-6s. | 两盏灯同时熄灭或整条走廊一起变暗。 | 只重做灯光节拍：3-4 秒单独熄灭最近灯，其他灯保持一秒不变，再在 4-6 秒单独熄灭远处灯。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
