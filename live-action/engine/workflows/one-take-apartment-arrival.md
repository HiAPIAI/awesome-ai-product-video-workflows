<!-- Generated from data/workflows.json. Do not edit directly. -->

# One-Take Apartment Arrival

## 公寓归来一镜到底

A 15-second continuous arrival that moves from hallway isolation to a warm occupied room.

15 秒连续镜头，从走廊的孤立感进入有人等待的暖色房间。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Cinematic Shots / 电影镜头 |
| Mode | image-to-video |
| Duration | 15s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | advanced |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Reveal that the apartment is not empty through blocking and sound before showing the second person.

**中文：** 先通过调度和声音暗示房间并非空置，再展示第二个人。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | First frame with the returning adult, hallway, apartment door, wardrobe, and key prop. | 包含归家成年人、走廊、房门、服装和钥匙道具的首帧。 |
| `@Image2` | optional | Optional identity reference for the person waiting inside; bind only identity and wardrobe. | 可选的屋内等待者身份参考；只绑定身份与服装。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-5s | Follow behind as the subject unlocks the door with one natural action. | 从后方跟随人物，用一个自然动作开门。 |
| 5-10s | Camera crosses the threshold and arcs to profile; warm room tone replaces hallway hum. | 镜头跨过门槛并绕到侧面；暖色室内声替代走廊底噪。 |
| 10-15s | A voice says one short line off-screen, then the waiting person is revealed at the edge of frame. | 画外传来一句短台词，随后等待者在画面边缘被揭示。 |

## Sound / 声音

**EN:** Keys, lock, door seal, hallway hum transitioning to room tone; one off-screen line: 'You're late.'

**中文：** 钥匙、门锁、门封、走廊底噪过渡到室内声；画外一句：“你回来晚了。”

## Prompt (English)

```text
@Image1 is the exact first frame for the returning adult, hallway, apartment door, wardrobe, and keys. If @Image2 is supplied, use it only for the waiting adult's identity and wardrobe. One continuous 15-second live-action shot, no cuts. 0-5s: controlled handheld follow from behind as the subject unlocks and opens the door in one natural action. 5-10s: the camera crosses the threshold and makes one smooth arc to the subject's profile; cool hallway light gives way to warm practical room light, and hallway hum gives way to quiet room tone. 10-15s: before the second person is visible, an off-screen adult voice says, 'You're late.' The camera continues the same arc and reveals the waiting person seated only at the edge of frame. The returning subject pauses and exhales; no embrace and no second line. Preserve identity, door geometry, keys, wardrobe, light direction, and continuous camera path. No cuts, no teleporting, no extra rooms, no text.
```

## 提示词（中文）

```text
@Image1 是归家成年人、走廊、房门、服装和钥匙的精确首帧。若提供 @Image2，只用于屋内等待者的身份与服装。15 秒真人写实一镜到底，不切镜。0-5 秒：受控手持从后方跟随，人物用一个自然动作开锁并推门。5-10 秒：镜头跨过门槛，只做一次平滑弧线移动到人物侧面；冷色走廊光过渡为暖色实景灯，走廊底噪过渡为安静室内声。10-15 秒：第二个人尚未入画前，成年画外音说：“你回来晚了。” 镜头沿同一弧线继续，等待者只在画面边缘被揭示。归家者停住并呼气；不拥抱、不加第二句台词。锁定身份、门体几何、钥匙、服装、光向和连续镜头路径。无切镜、无瞬移、无多余房间、无文字。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 is the exact first frame for the returning adult, hallway, apartment door, wardrobe, and keys. If @Image2 is supplied, use it only for the waiting adult's identity and wardrobe. One continuous 15-second live-action shot, no cuts. 0-5s: controlled handheld follow from behind as the subject unlocks and opens the door in one natural action. 5-10s: the camera crosses the threshold and makes one smooth arc to the subject's profile; cool hallway light gives way to warm practical room light, and hallway hum gives way to quiet room tone. 10-15s: before the second person is visible, an off-screen adult voice says, 'You're late.' The camera continues the same arc and reveals the waiting person seated only at the edge of frame. The returning subject pauses and exhales; no embrace and no second line. Preserve identity, door geometry, keys, wardrobe, light direction, and continuous camera path. No cuts, no teleporting, no extra rooms, no text.",
    "duration": 15,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://apartment-arrival-first-frame"
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 是归家成年人、走廊、房门、服装和钥匙的精确首帧。若提供 @Image2，只用于屋内等待者的身份与服装。15 秒真人写实一镜到底，不切镜。0-5 秒：受控手持从后方跟随，人物用一个自然动作开锁并推门。5-10 秒：镜头跨过门槛，只做一次平滑弧线移动到人物侧面；冷色走廊光过渡为暖色实景灯，走廊底噪过渡为安静室内声。10-15 秒：第二个人尚未入画前，成年画外音说：“你回来晚了。” 镜头沿同一弧线继续，等待者只在画面边缘被揭示。归家者停住并呼气；不拥抱、不加第二句台词。锁定身份、门体几何、钥匙、服装、光向和连续镜头路径。无切镜、无瞬移、无多余房间、无文字。",
    "duration": 15,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true,
    "first_frame_url": "asset://apartment-arrival-first-frame"
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Treat the doorway as the spatial anchor. The camera has one uninterrupted path and the waiting person stays off-screen until the final beat.

**中文：** 以门口为固定空间锚点。镜头只有一条不中断路径，等待者在最后节拍前始终不入画。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The camera cuts or teleports inside. | Retake only camera continuity: one follow plus one arc, no new framing instructions. | 镜头切断或瞬移进屋。 | 只重做镜头连续性：一次跟随加一次弧线，不增加新机位。 |
| The waiting person appears too early. | Keep them fully off-screen until after the line; preserve dialogue and actor timing. | 等待者过早出现。 | 让其在台词说完前完全处于画外；保留台词和演员时序。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
