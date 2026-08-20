<!-- Generated from data/workflows.json. Do not edit directly. -->

# Workshop Day-In-The-Life

## 手工作坊一日片段

An observational mini-sequence that moves from hands to face to finished object without glossy commercial coverage.

从手部、人物到完成物自然推进，不使用光鲜商业补拍的观察式微序列。

> **Render status / 生成状态：** This entry is an unverified workflow template. It has not yet completed the repository's real-task, file-validation, and human-review gate. / 本条目是未实测工作流模板，尚未完成仓库要求的真实任务、文件校验和人工画面复核。

| Field | Value |
| --- | --- |
| Category | Documentary / UGC / 纪实与 UGC |
| Mode | text-to-video |
| Duration | 15s |
| Aspect ratio | 16:9 |
| Resolution | 720p |
| Difficulty | intermediate |
| Render status | Unverified template / 未实测模板 |

## Directorial Intent / 导演意图

**EN:** Show skill and concentration through process details, not through claims or a presenter explanation.

**中文：** 通过过程细节展示技能与专注，不靠口头宣传或主持讲解。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `text-only` | yes | No reference required; use an original adult craftsperson, simple workshop, and generic handmade object. | 无需参考；使用原创成年手艺人、朴素工作坊和通用手工作品。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-5s | Close on hands measuring and making one precise mark on raw material. | 近景观察双手测量并在原材料上做一个精确标记。 |
| 5-10s | Move to side medium shot as the craftsperson performs one controlled tool action. | 移动到侧面中景，手艺人完成一次受控工具动作。 |
| 10-15s | Reveal the finished detail in their hands, then end on a quiet inspection rather than a smile to camera. | 展示手中完成细节，以安静检查结束，而不是对镜头微笑。 |

## Sound / 声音

**EN:** Workshop ambience, measuring tool, one controlled machine or hand-tool sound, breath; no narration or music.

**中文：** 工作坊底噪、测量工具、一次受控机具或手工具声、呼吸；无旁白、无音乐。

## Prompt (English)

```text
Grounded observational live-action sequence in a small working craft studio. One adult craftsperson in practical worn work clothes, natural skin and hands, generic unbranded tools, realistic dust and material texture. 0-5s: close shot on hands measuring raw material and making exactly one precise pencil mark; steady camera, tool sounds clear. 5-10s: move to one side medium shot as the craftsperson performs one controlled cutting, carving, or shaping action; keep hands and material physically connected, no sparks unless the tool requires them. 10-15s: reveal the finished small detail resting in their hands, then hold on their quiet inspection and one satisfied breath, not a smile to camera. Preserve identity, clothing, tool type, material color, bench layout, and work direction. Sound: workshop ambience, measuring tool, one controlled tool sound, breath. No narration, no music, no brand logo, no fast montage, no product glamour spin, no extra hands, no instant transformation, no text.
```

## 提示词（中文）

```text
小型真实手工作坊里的观察式真人片段。一名成年手艺人穿有使用痕迹的实用工作服，保留自然皮肤和手部；工具通用无品牌，灰尘和材料纹理真实。0-5 秒：近景观察双手测量原材料并只做一个精确铅笔标记；镜头稳定，工具声清晰。5-10 秒：移动到一个侧面中景，手艺人完成一次受控切割、雕刻或塑形动作；双手和材料保持物理连接，除非工具真实需要，否则不出现火花。10-15 秒：展示手中完成的小细节，然后停在安静检查和一次满意呼吸上，不对镜头微笑。锁定身份、服装、工具类型、材料颜色、工作台布局和工作方向。声音：工作坊底噪、测量工具、一次受控工具声、呼吸。无旁白、无音乐、无品牌标志、无快速蒙太奇、无产品炫转、无多余手、无瞬间变形、无文字。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "Grounded observational live-action sequence in a small working craft studio. One adult craftsperson in practical worn work clothes, natural skin and hands, generic unbranded tools, realistic dust and material texture. 0-5s: close shot on hands measuring raw material and making exactly one precise pencil mark; steady camera, tool sounds clear. 5-10s: move to one side medium shot as the craftsperson performs one controlled cutting, carving, or shaping action; keep hands and material physically connected, no sparks unless the tool requires them. 10-15s: reveal the finished small detail resting in their hands, then hold on their quiet inspection and one satisfied breath, not a smile to camera. Preserve identity, clothing, tool type, material color, bench layout, and work direction. Sound: workshop ambience, measuring tool, one controlled tool sound, breath. No narration, no music, no brand logo, no fast montage, no product glamour spin, no extra hands, no instant transformation, no text.",
    "duration": 15,
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
    "prompt": "小型真实手工作坊里的观察式真人片段。一名成年手艺人穿有使用痕迹的实用工作服，保留自然皮肤和手部；工具通用无品牌，灰尘和材料纹理真实。0-5 秒：近景观察双手测量原材料并只做一个精确铅笔标记；镜头稳定，工具声清晰。5-10 秒：移动到一个侧面中景，手艺人完成一次受控切割、雕刻或塑形动作；双手和材料保持物理连接，除非工具真实需要，否则不出现火花。10-15 秒：展示手中完成的小细节，然后停在安静检查和一次满意呼吸上，不对镜头微笑。锁定身份、服装、工具类型、材料颜色、工作台布局和工作方向。声音：工作坊底噪、测量工具、一次受控工具声、呼吸。无旁白、无音乐、无品牌标志、无快速蒙太奇、无产品炫转、无多余手、无瞬间变形、无文字。",
    "duration": 15,
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

**EN:** The same material piece stays in the craftsperson's hands from mark to tool action to inspection. Do not substitute a finished object mid-shot.

**中文：** 从标记、工具动作到检查，始终是同一块材料。不要在镜头中途替换成完成品。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| The material instantly becomes finished. | Retake process continuity only: keep the same piece visible through mark, action, and inspection. | 材料瞬间变成完成品。 | 只重做过程连续性：同一块材料贯穿标记、动作和检查。 |
| The sequence becomes a glossy product ad. | Remove hero spin and camera-facing smile; preserve tools, sound, and process beats. | 片段变成光鲜产品广告。 | 移除产品炫转和对镜头微笑；工具、声音和过程节拍不变。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
