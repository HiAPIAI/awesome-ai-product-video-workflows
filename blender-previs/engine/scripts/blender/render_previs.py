import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--render", action="store_true")
    return parser.parse_args(arguments)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for item in list(collection):
            if item.users == 0:
                collection.remove(item)


def set_node_input(node, names, value):
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return


def make_material(name, color, preset="matte"):
    material = bpy.data.materials.new(name=f"mat-{name}")
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    set_node_input(bsdf, ["Base Color"], (*color, 1.0))
    settings = {
        "matte": (0.0, 0.68),
        "painted-metal": (0.35, 0.3),
        "brushed-metal": (0.92, 0.24),
        "rubber": (0.0, 0.88),
        "fabric": (0.0, 0.78),
        "skin": (0.0, 0.52),
        "hazmat": (0.05, 0.4),
        "desert": (0.0, 0.95),
        "dust": (0.0, 0.9),
        "liquid": (0.0, 0.12),
        "glass": (0.0, 0.08),
        "emissive": (0.0, 0.3),
    }
    metallic, roughness = settings.get(preset, settings["matte"])
    set_node_input(bsdf, ["Metallic"], metallic)
    set_node_input(bsdf, ["Roughness"], roughness)
    if preset == "glass":
        set_node_input(bsdf, ["Transmission Weight", "Transmission"], 1.0)
        set_node_input(bsdf, ["IOR"], 1.46)
    elif preset == "liquid":
        set_node_input(bsdf, ["Transmission Weight", "Transmission"], 0.45)
        set_node_input(bsdf, ["IOR"], 1.36)
    elif preset == "hazmat":
        set_node_input(bsdf, ["Coat Weight", "Coat"], 0.35)
        set_node_input(bsdf, ["Coat Roughness"], 0.25)
    elif preset == "emissive":
        set_node_input(bsdf, ["Emission Color", "Emission"], (*color, 1.0))
        set_node_input(bsdf, ["Emission Strength"], 8.0)
    elif preset == "dust":
        set_node_input(bsdf, ["Emission Color", "Emission"], (*color, 1.0))
        set_node_input(bsdf, ["Emission Strength"], 0.3)
    texture_settings = {
        "painted-metal": (11.0, 0.14, 0.055),
        "brushed-metal": (65.0, 0.1, 0.025),
        "rubber": (28.0, 0.12, 0.03),
        "fabric": (48.0, 0.16, 0.025),
        "hazmat": (18.0, 0.1, 0.025),
        "desert": (3.2, 0.32, 0.12),
    }
    if preset in texture_settings:
        scale, strength, distance = texture_settings[preset]
        noise = nodes.new(type="ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = scale
        noise.inputs["Detail"].default_value = 3.0
        noise.inputs["Roughness"].default_value = 0.65
        bump = nodes.new(type="ShaderNodeBump")
        bump.inputs["Strength"].default_value = strength
        bump.inputs["Distance"].default_value = distance
        material.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        material.node_tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def create_primitive(item):
    primitive = item["primitive"]
    if primitive == "cube":
        bpy.ops.mesh.primitive_cube_add()
    elif primitive == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12)
    elif primitive == "cylinder":
        bpy.ops.mesh.primitive_cylinder_add(vertices=24)
    elif primitive == "cone":
        bpy.ops.mesh.primitive_cone_add(vertices=24)
    else:
        raise ValueError(f"Unsupported primitive: {primitive}")
    obj = bpy.context.object
    obj.name = item["id"]
    obj.dimensions = item["dimensions"]
    obj.color = (*item["color"], 1.0)
    obj.data.materials.append(make_material(item["id"], item["color"], item.get("materialPreset", "matte")))
    if item.get("smooth"):
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    bevel_width = item.get("bevel", 0)
    if bevel_width > 0:
        modifier = obj.modifiers.new(name="cinematic-bevel", type="BEVEL")
        modifier.width = min(bevel_width, min(item["dimensions"]) * 0.24)
        modifier.segments = 3
    bpy.context.view_layer.update()
    for keyframe in item["keyframes"]:
        obj.location = keyframe["location"]
        obj.rotation_euler = [math.radians(value) for value in keyframe.get("rotation", [0, 0, 0])]
        obj.keyframe_insert(data_path="location", frame=keyframe["frame"])
        obj.keyframe_insert(data_path="rotation_euler", frame=keyframe["frame"])
    return obj


def create_ground(world):
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, -0.1))
    ground = bpy.context.object
    ground.name = "ground"
    ground.dimensions = (world["groundSize"][0], world["groundSize"][1], 0.2)
    ground.color = (*world["groundColor"], 1.0)
    ground.data.materials.append(make_material("ground", world["groundColor"], "desert"))
    bpy.context.view_layer.update()


def create_lights(world):
    for item in world.get("lights", []):
        light_data = bpy.data.lights.new(item["id"], type=item["type"].upper())
        light_data.color = item["color"]
        light_data.energy = item["energy"]
        if item["type"] == "area":
            light_data.shape = "DISK"
            light_data.size = item.get("size", 3.0)
        elif item["type"] == "sun":
            light_data.angle = math.radians(item.get("size", 4.0))
        elif item["type"] in ("point", "spot"):
            light_data.shadow_soft_size = item.get("size", 0.5)
        if item["type"] == "spot":
            light_data.spot_size = math.radians(item.get("spotSize", 45))
            light_data.spot_blend = 0.45
        light = bpy.data.objects.new(item["id"], light_data)
        light.location = item["location"]
        light.rotation_euler = [math.radians(value) for value in item["rotation"]]
        bpy.context.collection.objects.link(light)


def configure_world(world_spec):
    world = bpy.context.scene.world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    background = nodes.new(type="ShaderNodeBackground")
    background.inputs["Color"].default_value = (*world_spec["background"], 1.0)
    background.inputs["Strength"].default_value = 0.12
    output = nodes.new(type="ShaderNodeOutputWorld")
    links.new(background.outputs["Background"], output.inputs["Surface"])
    density = world_spec.get("render", {}).get("volumeDensity", 0)
    if density > 0:
        volume = nodes.new(type="ShaderNodeVolumeScatter")
        volume.inputs["Color"].default_value = (0.62, 0.38, 0.18, 1.0)
        volume.inputs["Density"].default_value = density
        volume.inputs["Anisotropy"].default_value = 0.35
        links.new(volume.outputs["Volume"], output.inputs["Volume"])


def create_camera(camera_spec):
    camera_data = bpy.data.cameras.new("previs-camera")
    camera_data.sensor_width = camera_spec["sensorWidthMm"]
    camera = bpy.data.objects.new("previs-camera", camera_data)
    bpy.context.collection.objects.link(camera)
    target = bpy.data.objects.new("camera-target", None)
    bpy.context.collection.objects.link(target)
    constraint = camera.constraints.new(type="TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"
    if camera_spec.get("fStop") is not None:
        camera_data.dof.use_dof = True
        camera_data.dof.focus_object = target
        camera_data.dof.aperture_fstop = camera_spec["fStop"]
    for keyframe in camera_spec["keyframes"]:
        camera.location = keyframe["location"]
        camera_data.lens = keyframe["lensMm"]
        target.location = keyframe["target"]
        camera.keyframe_insert(data_path="location", frame=keyframe["frame"])
        camera_data.keyframe_insert(data_path="lens", frame=keyframe["frame"])
        target.keyframe_insert(data_path="location", frame=keyframe["frame"])
    bpy.context.scene.camera = camera
    return camera, target


def rounded(value):
    return round(float(value), 6)


def vector(values):
    return [rounded(value) for value in values]


def record_motion_trace(spec, output, objects, camera, target):
    scene = bpy.context.scene
    timeline = spec["timeline"]
    records = []
    for frame in range(timeline["frameStart"], timeline["frameEnd"] + 1):
        scene.frame_set(frame)
        dependency_graph = bpy.context.evaluated_depsgraph_get()
        evaluated_camera = camera.evaluated_get(dependency_graph)
        evaluated_target = target.evaluated_get(dependency_graph)
        camera_matrix = evaluated_camera.matrix_world
        camera_location = camera_matrix.to_translation()
        target_location = evaluated_target.matrix_world.to_translation()
        camera_rotation = camera_matrix.to_quaternion()
        forward = camera_rotation @ Vector((0.0, 0.0, -1.0))
        up = camera_rotation @ Vector((0.0, 1.0, 0.0))
        object_records = []
        for item in spec["objects"]:
            evaluated_object = objects[item["id"]].evaluated_get(dependency_graph)
            object_records.append({
                "id": item["id"],
                "location": vector(evaluated_object.matrix_world.to_translation()),
                "rotationEulerDeg": vector(
                    math.degrees(value)
                    for value in evaluated_object.matrix_world.to_euler("XYZ")
                ),
            })
        records.append({
            "frame": frame,
            "timeSeconds": rounded((frame - timeline["frameStart"]) / timeline["fps"]),
            "camera": {
                "location": vector(camera_location),
                "target": vector(target_location),
                "forward": vector(forward.normalized()),
                "up": vector(up.normalized()),
                "lensMm": rounded(evaluated_camera.data.lens),
                "horizontalFovDeg": rounded(math.degrees(evaluated_camera.data.angle_x)),
                "distanceToTarget": rounded((target_location - camera_location).length),
            },
            "objects": object_records,
        })
    trace = {
        "version": 1,
        "shotId": spec["id"],
        "fps": timeline["fps"],
        "frameStart": timeline["frameStart"],
        "frameEnd": timeline["frameEnd"],
        "frameCount": len(records),
        "objectIds": [item["id"] for item in spec["objects"]],
        "frames": records,
    }
    with (output / "motion-trace.json").open("w", encoding="utf-8") as handle:
        json.dump(trace, handle, indent=2)
        handle.write("\n")
    scene.frame_set(timeline["frameStart"])


def make_linear():
    for action in bpy.data.actions:
        if hasattr(action, "fcurves"):
            curves = action.fcurves
            set_curves_linear(curves)
            continue
        for layer in action.layers:
            for strip in layer.strips:
                for channel_bag in strip.channelbags:
                    set_curves_linear(channel_bag.fcurves)


def set_curves_linear(curves):
    for curve in curves:
        for point in curve.keyframe_points:
            point.interpolation = "LINEAR"


def configure_scene(spec, output):
    scene = bpy.context.scene
    timeline = spec["timeline"]
    scene.frame_start = timeline["frameStart"]
    scene.frame_end = timeline["frameEnd"]
    scene.render.fps = timeline["fps"]
    scene.render.resolution_x = spec["resolution"]["width"]
    scene.render.resolution_y = spec["resolution"]["height"]
    scene.render.resolution_percentage = 100
    render_spec = spec["world"].get("render", {"engine": "workbench", "samples": 1})
    if render_spec["engine"] == "cycles":
        scene.render.engine = "CYCLES"
        scene.cycles.samples = render_spec["samples"]
        scene.cycles.use_denoising = True
        scene.cycles.max_bounces = 6
        scene.cycles.diffuse_bounces = 3
        scene.cycles.glossy_bounces = 3
        scene.cycles.transmission_bounces = 4
        scene.render.use_motion_blur = True
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
        configure_world(spec["world"])
    else:
        scene.render.engine = "BLENDER_WORKBENCH"
        scene.display.shading.light = "STUDIO"
        scene.display.shading.color_type = "MATERIAL"
        scene.display.shading.show_shadows = True
        scene.display.shading.show_cavity = True
        scene.display.shading.cavity_type = "WORLD"
        scene.display.shading.background_type = "WORLD"
        scene.world.color = spec["world"]["background"]
    frames = output / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = str(frames / "frame_")
    scene.render.use_file_extension = True


def main():
    options = parse_args()
    spec_file = Path(options.spec).resolve()
    output = Path(options.out_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    with spec_file.open("r", encoding="utf-8") as handle:
        spec = json.load(handle)
    clear_scene()
    configure_scene(spec, output)
    create_ground(spec["world"])
    objects = {}
    for item in spec["objects"]:
        objects[item["id"]] = create_primitive(item)
    create_lights(spec["world"])
    camera, target = create_camera(spec["camera"])
    make_linear()
    record_motion_trace(spec, output, objects, camera, target)
    blend_file = output / "previs.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_file))
    timeline = spec["timeline"]
    expected_frame_count = timeline["frameEnd"] - timeline["frameStart"] + 1
    if options.render:
        bpy.ops.render.render(animation=True)
    rendered_files = sorted((output / "frames").glob("frame_*.png")) if options.render else []
    expected_names = {
        f"frame_{frame:04d}.png"
        for frame in range(timeline["frameStart"], timeline["frameEnd"] + 1)
    }
    valid_expected_files = [
        file for file in rendered_files
        if file.name in expected_names and file.stat().st_size > 0
    ]
    unexpected_files = [file for file in rendered_files if file.name not in expected_names]
    empty_files = [file for file in rendered_files if file.name in expected_names and file.stat().st_size == 0]
    rendered_frame_count = len(valid_expected_files)
    render_completed = (
        options.render
        and rendered_frame_count == expected_frame_count
        and not unexpected_files
        and not empty_files
    )
    report = {
        "version": 1,
        "shotId": spec["id"],
        "blenderVersion": bpy.app.version_string,
        "status": "frames-complete" if render_completed else "scene-only-complete" if not options.render else "frames-incomplete",
        "frameStart": timeline["frameStart"],
        "frameEnd": timeline["frameEnd"],
        "expectedFrameCount": expected_frame_count,
        "renderRequested": options.render,
        "renderCompleted": render_completed,
        "renderedFrameCount": rendered_frame_count,
        "unexpectedFrameCount": len(unexpected_files),
        "emptyFrameCount": len(empty_files),
        "fps": timeline["fps"],
        "resolution": spec["resolution"],
        "sceneSaved": blend_file.exists() and blend_file.stat().st_size > 0,
        "encoded": False,
        "files": ["previs.blend", "motion-trace.json"] + (["frames/"] if options.render else []),
    }
    with (output / "render-report.json").open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")
    print(json.dumps(report))
    if options.render and not render_completed:
        raise RuntimeError(
            f"Blender produced {rendered_frame_count} of {expected_frame_count} expected frames"
        )


if __name__ == "__main__":
    main()
