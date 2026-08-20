<!-- Generated from data/workflows.json. Do not edit directly. -->

# Acoustic Room Performance

## 房间原声演奏

A single-take musician workflow that keeps hands, instrument, voice, and room acoustics coherent.

保持手、乐器、人声和房间声学一致的单镜头音乐人工作流。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Performance / 人物表演 |
| Mode | reference-to-video |
| Duration | 15s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | advanced |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Capture an intimate first take, including breath and small finger noise, without concert spectacle.

**中文：** 捕捉带呼吸和轻微指尖噪声的亲密第一遍演奏，不制造演唱会奇观。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | Adult musician identity, instrument, hand placement, wardrobe, chair, and room reference. | 成年音乐人身份、乐器、手位、服装、椅子和房间参考。 |
| `@Audio1` | yes | Original or licensed 15-second performance audio; bind timing and voice only. | 原创或已授权的 15 秒演奏音频；只绑定时序和声音。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-5s | Musician settles, inhales, and begins the first phrase without a count-in. | 音乐人坐稳、吸气，不数拍直接开始第一句。 |
| 5-11s | Camera makes one slow push; hands follow the supplied audio rhythm exactly. | 镜头只做一次缓慢推进；双手严格跟随提供音频节奏。 |
| 11-15s | Finish the phrase, let the final resonance decay, and keep the musician still. | 结束乐句，让最后余音自然衰减，音乐人保持不动。 |

## Sound / 声音

**EN:** Use @Audio1 exactly for timing and performance; preserve room resonance and finger noise, add no score.

**中文：** 严格使用 @Audio1 的时序与表演；保留房间混响和指尖噪声，不添加配乐。

## Prompt (English)

```text
Use @Image1 only for the adult musician's exact identity, instrument, hand placement, wardrobe, chair, and room. Use @Audio1 as the exact 15-second timing and performance reference; preserve its voice or instrument phrase and natural room resonance. One continuous live-action medium shot, no cuts. 0-5s: musician settles, inhales once, and begins without a count-in. 5-11s: camera makes one very slow push while hands and mouth follow @Audio1 precisely; keep finger contact physically plausible and instrument geometry stable. 11-15s: finish the phrase, stop moving, and let the final resonance decay naturally. Practical window or lamp light, natural skin, intimate room scale. No concert lighting, no audience, no applause, no extra instrument, no hand duplication, no lyric text, no subtitles, no camera orbit, no added music, no audio remix beyond spatially matching the room.
```

## 提示词（中文）

```text
@Image1 只绑定成年音乐人的精确身份、乐器、手位、服装、椅子和房间。@Audio1 作为精确的 15 秒时序与表演参考；保留其中人声或乐器乐句和自然房间混响。真人中景一镜到底，不切镜。0-5 秒：音乐人坐稳、吸气一次，不数拍直接开始。5-11 秒：镜头只做一次非常缓慢的推进，双手与口型严格跟随 @Audio1；指尖接触符合物理，乐器几何稳定。11-15 秒：结束乐句、停止动作，让最后余音自然衰减。使用实景窗光或灯光、自然皮肤、亲密房间尺度。无演唱会灯光、无观众、无掌声、无额外乐器、无手部复制、无歌词文字、无字幕、无环绕镜头、无新增音乐，不对声音做超出房间空间匹配的重混。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "Use @Image1 only for the adult musician's exact identity, instrument, hand placement, wardrobe, chair, and room. Use @Audio1 as the exact 15-second timing and performance reference; preserve its voice or instrument phrase and natural room resonance. One continuous live-action medium shot, no cuts. 0-5s: musician settles, inhales once, and begins without a count-in. 5-11s: camera makes one very slow push while hands and mouth follow @Audio1 precisely; keep finger contact physically plausible and instrument geometry stable. 11-15s: finish the phrase, stop moving, and let the final resonance decay naturally. Practical window or lamp light, natural skin, intimate room scale. No concert lighting, no audience, no applause, no extra instrument, no hand duplication, no lyric text, no subtitles, no camera orbit, no added music, no audio remix beyond spatially matching the room.",
    "duration": 15,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "reference_image_urls": [
      "asset://acoustic-performer"
    ],
    "reference_audio_urls": [
      "asset://licensed-performance-audio"
    ]
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 只绑定成年音乐人的精确身份、乐器、手位、服装、椅子和房间。@Audio1 作为精确的 15 秒时序与表演参考；保留其中人声或乐器乐句和自然房间混响。真人中景一镜到底，不切镜。0-5 秒：音乐人坐稳、吸气一次，不数拍直接开始。5-11 秒：镜头只做一次非常缓慢的推进，双手与口型严格跟随 @Audio1；指尖接触符合物理，乐器几何稳定。11-15 秒：结束乐句、停止动作，让最后余音自然衰减。使用实景窗光或灯光、自然皮肤、亲密房间尺度。无演唱会灯光、无观众、无掌声、无额外乐器、无手部复制、无歌词文字、无字幕、无环绕镜头、无新增音乐，不对声音做超出房间空间匹配的重混。",
    "duration": 15,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "reference_image_urls": [
      "asset://acoustic-performer"
    ],
    "reference_audio_urls": [
      "asset://licensed-performance-audio"
    ]
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** The supplied audio is the master clock. Instrument geometry and finger contact must remain stable across the entire take.

**中文：** 提供的音频是主时钟。乐器几何和指尖接触在整个镜头中必须稳定。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| Hands do not match the performance. | Retake synchronization only using @Audio1 as master timing; keep camera and lighting identical. | 手部与演奏不匹配。 | 只重做同步：以 @Audio1 为主时钟；镜头和灯光不变。 |
| The room turns into a concert stage. | Remove audience and stage lighting; preserve performance, framing, and audio. | 房间变成演唱会舞台。 | 移除观众和舞台灯；表演、构图和音频保持。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
