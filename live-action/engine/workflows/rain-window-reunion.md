<!-- Generated from data/workflows.json. Do not edit directly. -->

# Rain-Window Reunion

## 雨窗重逢

A restrained reunion told through one glance, one step, and a reflection crossing the rain-streaked glass.

用一次对视、一步靠近和雨窗反射完成克制的重逢。

## Verified Render Evidence / 真实生成证据

- Task: `tk-hiapi-01KYGVY9CFFWGN5EMJR2XX6MD4`
- Tested: 2026-07-27T04:09:45.000Z
- Prompt (en) SHA-256: `4e62eb45c28efb855a105fac2afa316fdc2fd297f45ca90f9e0fec1649a3eb9d`
- Artifact: 10.04s, 1280×720, 24 fps, H.264/AAC
- Artifact SHA-256: `f0d633cbf0fe2913cc4181cf1bec495681da4ee56797f34ac16a4896ed4f0d33`
- Review: partial-pass

**EN:** The generated video preserves the rainy window, cafe layout, standing adult, and first-frame composition, then moves into the requested listener close-up without an embrace. The seated person's face was blurred in the source image, so the detailed final close-up invents facial information that cannot be verified against the reference.

**中文：** 成片保留了雨窗、咖啡馆布局、站立人物和首帧构图，并按要求在无拥抱的情况下进入倾听者近景；但源图中坐着人物的脸较模糊，结尾清晰近景补出了无法与参考图核对的面部细节。

| Field | Value |
| --- | --- |
| Category | Cinematic Shots / 电影镜头 |
| Mode | image-to-video |
| Duration | 10s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | intermediate |
| Render status | Verified render (partial-pass) / 已实测（部分通过） |

## Directorial Intent / 导演意图

**EN:** Move the relationship from uncertainty to recognition without a hug, speech, or melodramatic reveal.

**中文：** 不靠拥抱、长台词或煽情揭示，让关系从不确定转为彼此确认。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | First-frame reference containing both adults, wardrobe, window position, and practical lamp. | 包含两位成年人物、服装、窗户位置和实景灯的首帧参考。 |
| `room-tone` | optional | Optional rain and quiet cafe ambience reference. | 可选的雨声与安静咖啡馆环境声参考。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-3s | Hold a medium two-shot through wet glass; both notice each other but remain still. | 隔着湿润玻璃保持双人中景；两人发现彼此但暂时不动。 |
| 3-7s | A slow lateral slide clears the window frame as one person takes a single cautious step. | 镜头缓慢横移越过窗框，其中一人只谨慎迈出一步。 |
| 7-10s | End on the listener's held breath and softened eyes; no embrace, cut before contact. | 停在另一人屏住呼吸、眼神变软的反应上；不拥抱，在接触前切断。 |

## Sound / 声音

**EN:** Rain on glass, low room tone, one chair scrape, no score, no dialogue.

**中文：** 雨滴打在玻璃上，低声场，一次椅脚摩擦；无配乐、无台词。

## Prompt (English)

```text
@Image1 is the exact first frame and identity reference for both adults, their wardrobe, the cafe layout, the rain-streaked window, and the warm practical lamp. Preserve faces, age, hair, clothing, seating positions, and left-right screen geography. 0-3s: hold a quiet medium two-shot through the wet glass; both notice each other and remain still, only breathing and a tiny eye movement. 3-7s: one slow lateral camera slide clears the window frame while the standing person takes one cautious step forward. 7-10s: settle into a close reaction on the seated person; their jaw releases, eyes soften, and they hold one breath. Cut before any embrace or touch. Natural skin, restrained acting, physically motivated warm lamp and cool rain light. Sound: rain, room tone, one chair scrape. No dialogue, no score, no text, no face drift, no wardrobe change.
```

## 提示词（中文）

```text
@Image1 是两位成年人物、服装、咖啡馆布局、雨窗和暖色实景灯的精确首帧与身份参考。锁定脸、年龄、发型、服装、座位和左右空间关系。0-3 秒：隔着湿润玻璃保持安静双人中景，两人发现彼此但不移动，只保留呼吸和极轻微的眼神变化。3-7 秒：镜头只做一次缓慢横移，越过窗框；站着的人谨慎向前迈一步。7-10 秒：落到坐着人物的近景反应，下颌放松、眼神变软、屏住一次呼吸。在任何拥抱或触碰前切断。真实皮肤、克制表演、暖灯与冷雨光均有物理来源。声音只有雨、室内底噪和一次椅脚摩擦。无台词、无配乐、无文字、无变脸、无换装。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact first frame and identity reference for both adults, their wardrobe, the cafe layout, the rain-streaked window, and the warm practical lamp. Preserve faces, age, hair, clothing, seating positions, and left-right screen geography. 0-3s: hold a quiet medium two-shot through the wet glass; both notice each other and remain still, only breathing and a tiny eye movement. 3-7s: one slow lateral camera slide clears the window frame while the standing person takes one cautious step forward. 7-10s: settle into a close reaction on the seated person; their jaw releases, eyes soften, and they hold one breath. Cut before any embrace or touch. Natural skin, restrained acting, physically motivated warm lamp and cool rain light. Sound: rain, room tone, one chair scrape. No dialogue, no score, no text, no face drift, no wardrobe change.",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://rain-window-reunion-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是两位成年人物、服装、咖啡馆布局、雨窗和暖色实景灯的精确首帧与身份参考。锁定脸、年龄、发型、服装、座位和左右空间关系。0-3 秒：隔着湿润玻璃保持安静双人中景，两人发现彼此但不移动，只保留呼吸和极轻微的眼神变化。3-7 秒：镜头只做一次缓慢横移，越过窗框；站着的人谨慎向前迈一步。7-10 秒：落到坐着人物的近景反应，下颌放松、眼神变软、屏住一次呼吸。在任何拥抱或触碰前切断。真实皮肤、克制表演、暖灯与冷雨光均有物理来源。声音只有雨、室内底噪和一次椅脚摩擦。无台词、无配乐、无文字、无变脸、无换装。",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://rain-window-reunion-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Keep both identities, wardrobe, window reflections, lamp position, and screen direction fixed. The only story change is one step and one softened reaction.

**中文：** 固定两人身份、服装、窗户反射、灯位和画面方向。唯一叙事变化是一人迈步和另一人的软化反应。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The scene becomes an instant hug. | Retake only the ending: explicitly cut before contact and hold the listener's reaction. | 场景直接变成拥抱。 | 只重做结尾：明确在接触前切断，并停留在倾听者反应上。 |
| Faces drift during the slide. | Reduce the lateral move and restate identity preservation; change no acting direction. | 横移时人物变脸。 | 减小横移幅度并重申身份锁定；不要同时修改表演。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
