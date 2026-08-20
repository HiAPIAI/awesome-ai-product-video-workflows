<!-- Generated from data/workflows.json. Do not edit directly. -->

# Night Market Walk

## 夜市漫步

A reference-driven vertical walk that prioritizes crowd realism, sensory detail, and a stable subject.

优先保证人群真实、感官细节和主体稳定的参考驱动竖屏漫步。

## Verified Render Evidence / 真实生成证据

- Task: `tk-hiapi-01KYGVY9P68NYDE7X1MGYSK34Y`
- Tested: 2026-07-27T04:10:59.000Z
- Prompt (en) SHA-256: `4ea5aa156671b6a6d653b115c778c7cd9aeac82bc12fa269d4b1f466634b9174`
- Artifact: 12.04s, 720×1280, 24 fps, H.264/AAC
- Artifact SHA-256: `164160bd36ce6b5e85060728c76b3f258266dfa946bc039a15656b6fb948d17b`
- Review: pass

**EN:** Using one original image reference and no motion video, the output preserves the adult's face, hair, dark raincoat, and grounded night-market lighting. It follows the requested rear follow, side-profile stall glance, and return-behind sequence while keeping the subject readable in a realistic crowd.

**中文：** 在只提供一张原创参考图、未提供动作视频的情况下，成片保持了成年人物的脸、发型、深色雨衣和写实夜市光线，并完成后方跟随、侧面看向摊位、再回到后方的镜头路径，人物在真实人群中始终清晰可辨。

| Field | Value |
| --- | --- |
| Category | Everyday Life / 生活场景 |
| Mode | reference-to-video |
| Duration | 12s |
| Aspect ratio | 9:16 |
| Resolution | 720p |
| Difficulty | intermediate |
| Render status | Verified render (pass) / 已实测（通过） |

## Directorial Intent / 导演意图

**EN:** Make the viewer feel present in a busy place while keeping the main subject readable and unhurried.

**中文：** 让观众感到置身繁忙现场，同时主角始终清晰且不慌乱。

## Reference Roles / 参考素材角色

| Slot | Required | English | 中文 |
| --- | --- | --- | --- |
| `@Image1` | yes | Main adult identity and wardrobe reference. | 成年主角身份与服装参考。 |
| `@Image2` | optional | Night-market location and lighting reference; do not transfer people. | 夜市地点与灯光参考；不要迁移其中人物。 |
| `@Video1` | optional | Reference only the slow handheld walking rhythm, not identity or exact scene content. | 只参考缓慢手持行走节奏，不迁移身份或具体场景内容。 |

## Beat Sheet / 时间轴

| Time | English | 中文 |
| --- | --- | --- |
| 0-4s | Follow behind at shoulder height as the subject enters the market stream. | 肩高从后方跟随主角进入夜市人流。 |
| 4-8s | Move to a side profile while the subject briefly looks at steam rising from a stall. | 移动到侧面，主角短暂看向摊位升起的蒸汽。 |
| 8-12s | Return behind as the subject keeps walking and disappears slightly deeper into the crowd. | 回到后方，主角继续前行并稍微融入更深处人群。 |

## Sound / 声音

**EN:** Layered vendor calls, footsteps, cooking sizzle, distant scooters, no added score and no clear branded speech.

**中文：** 摊贩叫卖、脚步、烹饪滋滋声、远处车辆声；不加配乐，不出现清晰品牌口播。

## Prompt (English)

```text
Use @Image1 only for the main adult's exact identity, hair, body proportions, and wardrobe. Use @Image2 only for night-market architecture, stall density, practical light colors, and atmosphere; do not transfer people or signage. If @Video1 is supplied, use only its slow shoulder-height handheld walking rhythm. Vertical 9:16, realistic crowded night market, no staged extras. 0-4s: follow behind as the subject enters the pedestrian stream at an unhurried pace. 4-8s: drift to one side profile while the subject briefly turns toward steam rising from a food stall; no purchase and no pose. 8-12s: return behind and let the subject walk slightly deeper into the crowd while remaining readable. Preserve identity, wardrobe, walking pace, stall geography, and light direction. Sound: layered vendor calls, footsteps, cooking sizzle, distant scooters. No music, no brand logos, no text overlays, no crowd duplication, no collisions, no sudden running.
```

## 提示词（中文）

```text
@Image1 只绑定成年主角的精确身份、发型、身体比例和服装。@Image2 只参考夜市建筑、摊位密度、实景灯颜色和氛围；不要迁移其中人物或招牌。若提供 @Video1，只参考其肩高缓慢手持行走节奏。竖屏 9:16，真实拥挤夜市，不要摆拍群众。0-4 秒：从后方跟随主角以不慌不忙的速度进入人流。4-8 秒：缓慢移动到侧面，主角短暂看向食物摊升起的蒸汽；不购买、不摆姿势。8-12 秒：回到后方，让主角继续走向人群更深处，同时保持可辨识。锁定身份、服装、行走速度、摊位空间和光向。声音：摊贩叫卖、脚步、烹饪滋滋声、远处车辆声。无音乐、无品牌标志、无文字叠加、无人群复制、无碰撞、无突然奔跑。
```

## HiAPI Request (English Prompt)

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "Use @Image1 only for the main adult's exact identity, hair, body proportions, and wardrobe. Use @Image2 only for night-market architecture, stall density, practical light colors, and atmosphere; do not transfer people or signage. If @Video1 is supplied, use only its slow shoulder-height handheld walking rhythm. Vertical 9:16, realistic crowded night market, no staged extras. 0-4s: follow behind as the subject enters the pedestrian stream at an unhurried pace. 4-8s: drift to one side profile while the subject briefly turns toward steam rising from a food stall; no purchase and no pose. 8-12s: return behind and let the subject walk slightly deeper into the crowd while remaining readable. Preserve identity, wardrobe, walking pace, stall geography, and light direction. Sound: layered vendor calls, footsteps, cooking sizzle, distant scooters. No music, no brand logos, no text overlays, no crowd duplication, no collisions, no sudden running.",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "reference_image_urls": [
      "asset://night-market-subject",
      "asset://night-market-location"
    ],
    "reference_video_urls": [
      "asset://slow-handheld-walk"
    ]
  }
}
```

<details><summary><strong>HiAPI 请求（中文提示词）</strong></summary>

```json
{
  "model": "seedance-2.0",
  "input": {
    "prompt": "@Image1 只绑定成年主角的精确身份、发型、身体比例和服装。@Image2 只参考夜市建筑、摊位密度、实景灯颜色和氛围；不要迁移其中人物或招牌。若提供 @Video1，只参考其肩高缓慢手持行走节奏。竖屏 9:16，真实拥挤夜市，不要摆拍群众。0-4 秒：从后方跟随主角以不慌不忙的速度进入人流。4-8 秒：缓慢移动到侧面，主角短暂看向食物摊升起的蒸汽；不购买、不摆姿势。8-12 秒：回到后方，让主角继续走向人群更深处，同时保持可辨识。锁定身份、服装、行走速度、摊位空间和光向。声音：摊贩叫卖、脚步、烹饪滋滋声、远处车辆声。无音乐、无品牌标志、无文字叠加、无人群复制、无碰撞、无突然奔跑。",
    "duration": 12,
    "resolution": "720p",
    "aspect_ratio": "9:16",
    "generate_audio": true,
    "reference_image_urls": [
      "asset://night-market-subject",
      "asset://night-market-location"
    ],
    "reference_video_urls": [
      "asset://slow-handheld-walk"
    ]
  }
}
```

</details>

Create the task with `POST https://api.hiapi.ai/v1/tasks`, then query `GET https://api.hiapi.ai/v1/tasks/{taskId}`. Replace every `asset://...` placeholder with your uploaded asset id or supported URL, and remove unused optional media fields from `input`.

使用 `POST https://api.hiapi.ai/v1/tasks` 创建任务，再查询 `GET https://api.hiapi.ai/v1/tasks/{taskId}`。请把所有 `asset://...` 占位符替换成已上传素材 id 或受支持的 URL，并从 `input` 中删除未使用的可选素材字段。

## Continuity Lock / 连续性锁定

**EN:** Identity comes only from @Image1; location comes only from @Image2; motion cadence comes only from @Video1. Do not cross-transfer roles.

**中文：** 身份只来自 @Image1，地点只来自 @Image2，运动节奏只来自 @Video1。不要跨角色迁移。

## Failure Fixes / 失败修复

| Symptom | Fix one variable | 症状 | 一次只改一个变量 |
| --- | --- | --- | --- |
| Background people inherit the main face. | Strengthen the role map: @Image1 controls only the main subject; keep crowd instructions unchanged. | 背景人物复制主角面孔。 | 强化角色表：@Image1 只控制主角；人群指令不变。 |
| The walk becomes too fast and chaotic. | Retake motion only with an unhurried pace and one side drift; preserve scene and sound. | 行走过快且混乱。 | 只重做运动：不慌不忙的步速加一次侧移；场景和声音保留。 |

---

[Browse all workflows](../README.md) | [浏览全部工作流](../README.zh-CN.md) | [Get a HiAPI API Key](https://www.hiapi.ai/en/register?utm_source=github&utm_medium=readme&utm_campaign=awesome-seedance-2-0-live-action-workflows) | [Install the HiAPI Skill](https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill)
