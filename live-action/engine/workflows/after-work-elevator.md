<!-- Generated from data/workflows.json. Do not edit directly. -->

# After-Work Elevator

## 下班电梯

A quiet vertical micro-story where public composure drops only after the elevator doors close.

电梯门关闭后才卸下公共场合克制的竖屏微故事。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Everyday Life / 生活场景 |
| Mode | text-to-video |
| Duration | 8s |
| Aspect ratio | 9:16 |
| Resolution | 720p |
| Difficulty | starter |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Show the difference between a performed social face and a private exhausted face in one locked composition.

**中文：** 在同一固定构图中表现社交表情与私人疲惫表情的差异。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `text-only` | yes | No reference required; use an original adult office-worker description. | 无需参考；使用原创成年上班族描述。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-3s | Front medium shot; subject gives a polite small nod to someone outside the elevator. | 正面中景；人物向电梯外的人礼貌轻点头。 |
| 3-5s | Doors close symmetrically while the polite expression remains. | 电梯门对称关闭，礼貌表情保持不变。 |
| 5-8s | Once fully closed, shoulders drop and the subject silently exhales, eyes lowering. | 门完全关闭后，肩膀下沉、无声呼气、视线降低。 |

## Sound / 声音

**EN:** Office corridor murmur, elevator chime, door motor, ventilation hum; no dialogue or score.

**中文：** 办公走廊人声、电梯提示音、门机声、通风底噪；无台词、无配乐。

## Prompt (English)

```text
Vertical 9:16 grounded live-action micro-story inside a modern office elevator. One adult office worker stands centered in a front medium shot, realistic tired skin and slightly creased work clothes. Camera is locked at chest height. 0-3s: the doors are open; the subject gives one polite small nod and a restrained social smile toward someone outside frame. 3-5s: the elevator doors close symmetrically while that polite expression remains. 5-8s: only after the doors are fully closed, the smile disappears, shoulders drop, eyes lower, and the subject releases one silent exhausted breath. Keep the same face, posture axis, lighting, elevator reflections, and centered framing. Sound: distant office murmur, one chime, door motor, ventilation hum. No dialogue, no crying, no collapse, no phone, no mirror duplicate, no camera move, no text.
```

## 提示词（中文）

```text
竖屏 9:16，现代办公楼电梯内的写实真人微故事。一名成年上班族居中站立，正面中景，保留真实疲惫皮肤和略有褶皱的工作服。镜头固定在胸口高度。0-3 秒：电梯门打开，人物向画外的人礼貌轻点头并保持克制社交微笑。3-5 秒：电梯门对称关闭，礼貌表情仍不改变。5-8 秒：只有在门完全关闭后，微笑消失、肩膀下沉、视线降低，并无声地疲惫呼气一次。固定同一张脸、姿态轴线、灯光、电梯反射和居中构图。声音：远处办公人声、一次提示音、门机声、通风底噪。无台词、不哭、不瘫倒、不看手机、不生成镜像分身、镜头不动、无文字。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "Vertical 9:16 grounded live-action micro-story inside a modern office elevator. One adult office worker stands centered in a front medium shot, realistic tired skin and slightly creased work clothes. Camera is locked at chest height. 0-3s: the doors are open; the subject gives one polite small nod and a restrained social smile toward someone outside frame. 3-5s: the elevator doors close symmetrically while that polite expression remains. 5-8s: only after the doors are fully closed, the smile disappears, shoulders drop, eyes lower, and the subject releases one silent exhausted breath. Keep the same face, posture axis, lighting, elevator reflections, and centered framing. Sound: distant office murmur, one chime, door motor, ventilation hum. No dialogue, no crying, no collapse, no phone, no mirror duplicate, no camera move, no text.",
    "duration": 8,
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
    "prompt": "竖屏 9:16，现代办公楼电梯内的写实真人微故事。一名成年上班族居中站立，正面中景，保留真实疲惫皮肤和略有褶皱的工作服。镜头固定在胸口高度。0-3 秒：电梯门打开，人物向画外的人礼貌轻点头并保持克制社交微笑。3-5 秒：电梯门对称关闭，礼貌表情仍不改变。5-8 秒：只有在门完全关闭后，微笑消失、肩膀下沉、视线降低，并无声地疲惫呼气一次。固定同一张脸、姿态轴线、灯光、电梯反射和居中构图。声音：远处办公人声、一次提示音、门机声、通风底噪。无台词、不哭、不瘫倒、不看手机、不生成镜像分身、镜头不动、无文字。",
    "duration": 8,
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

**EN:** Use one locked shot. The emotional change happens only after the doors fully meet.

**中文：** 全程一个固定镜头。情绪变化只能发生在电梯门完全闭合之后。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The expression changes before the doors close. | Retake only the timing: hold the social smile until full closure. | 门未关完表情就变化。 | 只重做时序：社交微笑保持到门完全闭合。 |
| The performance becomes tearful or dramatic. | Limit the change to shoulders, eyes, and one breath; keep all other motion identical. | 表演变成哭泣或戏剧化。 | 只保留肩膀、视线和一次呼气的变化；其余动作不变。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
