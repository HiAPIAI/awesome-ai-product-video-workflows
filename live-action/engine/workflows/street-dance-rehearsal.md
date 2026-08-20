<!-- Generated from data/workflows.json. Do not edit directly. -->

# Street Dance Rehearsal

## 街舞排练

A motion-reference workflow that transfers rhythm and blocking without transferring the source dancer's identity.

迁移动作节奏和走位但不迁移源舞者身份的动作参考工作流。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Performance / 人物表演 |
| Mode | reference-to-video |
| Duration | 10s |
| Aspect ratio | 9:16 |
| Resolution | 720p |
| Difficulty | advanced |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Make the clip feel like a rehearsal take with recoveries and breath, not a perfect music-video performance.

**中文：** 让片段像有调整和呼吸的排练，而不是完美音乐录像表演。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | Target adult dancer identity, body proportions, and rehearsal wardrobe. | 目标成年舞者身份、身体比例和排练服装。 |
| `@Video1` | yes | Transfer only choreography timing, weight shifts, and camera distance; never identity, face, or clothing. | 只迁移编舞时序、重心变化和镜头距离；绝不迁移身份、脸或服装。 |
| `@Audio1` | optional | Optional beat reference; use rhythm only, not vocals or copyrighted lyrics. | 可选节拍参考；只用节奏，不复制人声或受版权保护的歌词。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-3s | Dancer marks the first phrase at half energy, checking floor position. | 舞者以半力度标记第一段动作，同时确认地面位置。 |
| 3-7s | Run the main phrase at full energy with one lateral camera track. | 全力度完成主要动作段，镜头只做一次侧向跟移。 |
| 7-10s | Dancer misses the final accent slightly, recovers, and exhales with a small nod. | 舞者最后一个重拍略微失误，恢复后呼气并轻点头。 |

## Sound / 声音

**EN:** Shoe contact, breath, room reflections, optional non-vocal beat reference; no crowd and no applause.

**中文：** 鞋底触地、呼吸、房间反射声、可选无歌词节拍；无人群、无掌声。

## Prompt (English)

```text
Use @Image1 only for the target adult dancer's exact identity, face, hair, body proportions, and rehearsal wardrobe. Use @Video1 only for choreography timing, weight shifts, floor path, and camera distance; do not transfer the source dancer's identity, clothing, room, or face. If @Audio1 is supplied, use only its beat structure, not vocals or lyrics. Vertical 9:16 rehearsal studio, realistic mirrors without duplicate bodies, practical overhead light. 0-3s: dancer marks the first phrase at half energy and checks floor position. 3-7s: dancer performs the main phrase at full energy while camera makes one smooth lateral track. 7-10s: the final accent lands slightly late; dancer recovers naturally, exhales, and gives one small self-aware nod. Keep identity, wardrobe, body scale, floor marks, mirror geometry, and movement direction stable. Sound: shoes, breath, room reflections. No crowd, no applause, no stage lighting, no perfect music-video finish, no face transfer, no extra limbs, no text.
```

## 提示词（中文）

```text
@Image1 只绑定目标成年舞者的精确身份、脸、发型、身体比例和排练服装。@Video1 只参考编舞时序、重心变化、地面路径和镜头距离；不要迁移源舞者身份、服装、房间或面孔。若提供 @Audio1，只使用节拍结构，不复制人声或歌词。竖屏 9:16 排练室，镜面真实但不生成重复身体，使用实景顶灯。0-3 秒：舞者以半力度标记第一段动作并确认地面位置。3-7 秒：全力度完成主要动作段，镜头只做一次平滑侧向跟移。7-10 秒：最后一个重拍略微晚到，舞者自然恢复、呼气并带一点自知地轻点头。锁定身份、服装、身体比例、地面标记、镜面几何和运动方向。声音：鞋底、呼吸、房间反射。无人群、无掌声、无舞台灯、不做完美 MV 收尾、不迁移面孔、无多余肢体、无文字。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "Use @Image1 only for the target adult dancer's exact identity, face, hair, body proportions, and rehearsal wardrobe. Use @Video1 only for choreography timing, weight shifts, floor path, and camera distance; do not transfer the source dancer's identity, clothing, room, or face. If @Audio1 is supplied, use only its beat structure, not vocals or lyrics. Vertical 9:16 rehearsal studio, realistic mirrors without duplicate bodies, practical overhead light. 0-3s: dancer marks the first phrase at half energy and checks floor position. 3-7s: dancer performs the main phrase at full energy while camera makes one smooth lateral track. 7-10s: the final accent lands slightly late; dancer recovers naturally, exhales, and gives one small self-aware nod. Keep identity, wardrobe, body scale, floor marks, mirror geometry, and movement direction stable. Sound: shoes, breath, room reflections. No crowd, no applause, no stage lighting, no perfect music-video finish, no face transfer, no extra limbs, no text.",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "reference_image_urls": [
      "asset://target-dancer"
    ],
    "reference_video_urls": [
      "asset://choreography-reference"
    ],
    "reference_audio_urls": [
      "asset://beat-reference"
    ]
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 只绑定目标成年舞者的精确身份、脸、发型、身体比例和排练服装。@Video1 只参考编舞时序、重心变化、地面路径和镜头距离；不要迁移源舞者身份、服装、房间或面孔。若提供 @Audio1，只使用节拍结构，不复制人声或歌词。竖屏 9:16 排练室，镜面真实但不生成重复身体，使用实景顶灯。0-3 秒：舞者以半力度标记第一段动作并确认地面位置。3-7 秒：全力度完成主要动作段，镜头只做一次平滑侧向跟移。7-10 秒：最后一个重拍略微晚到，舞者自然恢复、呼气并带一点自知地轻点头。锁定身份、服装、身体比例、地面标记、镜面几何和运动方向。声音：鞋底、呼吸、房间反射。无人群、无掌声、无舞台灯、不做完美 MV 收尾、不迁移面孔、无多余肢体、无文字。",
    "duration": 10,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "reference_image_urls": [
      "asset://target-dancer"
    ],
    "reference_video_urls": [
      "asset://choreography-reference"
    ],
    "reference_audio_urls": [
      "asset://beat-reference"
    ]
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Identity belongs to @Image1; movement belongs to @Video1; beat belongs to @Audio1. Preserve those boundaries on every retake.

**中文：** 身份属于 @Image1，动作属于 @Video1，节拍属于 @Audio1。每次重做都保持这些边界。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The source dancer's face or clothes transfer. | Retake role binding only: @Video1 controls motion, never identity; keep choreography unchanged. | 源舞者的脸或服装被迁移。 | 只重做角色绑定：@Video1 只控制动作，不控制身份；编舞不变。 |
| The take looks too polished and staged. | Restore the half-energy mark and slightly late final accent; do not change camera or wardrobe. | 成片过于完美和摆拍。 | 恢复半力度标记和略晚的最后重拍；镜头和服装不变。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
