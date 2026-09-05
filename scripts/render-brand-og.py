"""
Render the brand OG share card (1200x630) in a headless Blender process.

Runs in its own factory-startup Blender — it does NOT open or touch any
existing .blend project. Builds the scene from scratch every time.

Usage:
  /Applications/Blender.app/Contents/MacOS/Blender \
    --background --factory-startup \
    --python scripts/render-brand-og.py -- <output_png> [samples]

The scene: the "RS" monogram extruded on a rounded brand tile, floating over
the ink background with the sky->amber signature gradient as rim light and a
soft data-grid glow. Deliberately restrained to match the site's precise look.
"""

import bpy
import sys
import math

# ── Args ────────────────────────────────────────────────────────────
argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/brand-og.png"
SAMPLES = int(argv[1]) if len(argv) > 1 else 256
# "tile" = square monogram on transparency (for compositing / icons);
# "og"   = full 1200x630 card scene.
MODE = argv[2] if len(argv) > 2 else "tile"

# Brand palette (BRAND.md), linear-ish sRGB tuples.
INK = (0.043, 0.059, 0.098, 1.0)      # #0b0f19
INK_RAISED = (0.078, 0.102, 0.169, 1.0)  # #141a2b
SKY = (0.22, 0.74, 0.97, 1.0)         # #38bdf8
AMBER = (0.984, 0.749, 0.141, 1.0)    # #fbbf24
FG = (0.96, 0.97, 0.98, 1.0)          # #f5f7fa


def srgb_to_linear(c):
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) if i < 3 else v
                 for i, v in enumerate(c))


SKY_L = srgb_to_linear(SKY)
AMBER_L = srgb_to_linear(AMBER)
INK_L = srgb_to_linear(INK)
INK_RAISED_L = srgb_to_linear(INK_RAISED)
FG_L = srgb_to_linear(FG)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def emission_mat(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return m


def glass_metal_mat(name, base):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = base
    bsdf.inputs["Metallic"].default_value = 0.9
    bsdf.inputs["Roughness"].default_value = 0.22
    return m


def rounded_tile(name, size, radius, depth):
    """A rounded-corner tile whose FLAT face points at the camera (-Y).

    Camera looks down -Y, so the tile is thin along Y (depth) and wide in
    X/Z (the face the viewer sees).
    """
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size, depth, size)  # thin on Y = faces the camera
    bpy.ops.object.transform_apply(scale=True)
    bev = obj.modifiers.new("Bevel", "BEVEL")
    bev.width = radius
    bev.segments = 12
    bev.limit_method = "ANGLE"
    bpy.ops.object.shade_smooth()
    return obj


def build():
    reset_scene()
    scene = bpy.context.scene

    # ── Render / output ─────────────────────────────────────────────
    scene.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = "GPU"
    except Exception as e:
        print("GPU setup skipped:", e)
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    if MODE == "tile":
        scene.render.resolution_x = 1024
        scene.render.resolution_y = 1024
        scene.render.film_transparent = True  # transparent PNG for compositing
    else:
        scene.render.resolution_x = 1200
        scene.render.resolution_y = 630
        scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Punchy"

    # ── World: deep ink ─────────────────────────────────────────────
    world = bpy.data.worlds.new("BrandWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = INK_L
    bg.inputs["Strength"].default_value = 0.15

    # ── Backdrop plane with a faint radial wash (og mode only) ──────
    if MODE == "og":
        bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -2))
        backdrop = bpy.context.active_object
        backdrop.name = "Backdrop"
        backdrop.rotation_euler = (math.radians(90), 0, 0)
        bm = bpy.data.materials.new("BackdropMat")
        bm.use_nodes = True
        nt = bm.node_tree
        nt.nodes.clear()
        grad = nt.nodes.new("ShaderNodeTexGradient")
        grad.gradient_type = "RADIAL"
        mapping = nt.nodes.new("ShaderNodeMapping")
        texco = nt.nodes.new("ShaderNodeTexCoord")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.0
        ramp.color_ramp.elements[0].color = INK_RAISED_L
        ramp.color_ramp.elements[1].position = 1.0
        ramp.color_ramp.elements[1].color = INK_L
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Strength"].default_value = 1.0
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(texco.outputs["Object"], mapping.inputs["Vector"])
        nt.links.new(mapping.outputs["Vector"], grad.inputs["Vector"])
        nt.links.new(grad.outputs["Color"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        backdrop.data.materials.append(bm)

    # ── The monogram tile — face toward camera (+Y), rounded ────────
    tile = rounded_tile("Tile", size=1.7, radius=0.3, depth=0.22)
    tile.location = (0, 0, 0)
    tile_mat = bpy.data.materials.new("TileMat")
    tile_mat.use_nodes = True
    tb = tile_mat.node_tree.nodes["Principled BSDF"]
    tb.inputs["Base Color"].default_value = INK_RAISED_L
    tb.inputs["Roughness"].default_value = 0.28
    tb.inputs["Metallic"].default_value = 0.5
    tile.data.materials.append(tile_mat)

    # ── "RS" text, extruded, proud of the tile FRONT face (-Y) ──────
    # Text is created in the XY plane; rotate so it faces -Y (the camera),
    # then push it just in front of the tile surface.
    bpy.ops.object.text_add()
    txt = bpy.context.active_object
    txt.data.body = "RS"
    txt.data.align_x = "CENTER"
    txt.data.align_y = "CENTER"
    txt.data.extrude = 0.05
    txt.data.bevel_depth = 0.01
    txt.data.size = 1.05
    txt.rotation_euler = (math.radians(90), 0, 0)
    txt.location = (0, -(0.11 + 0.05), 0)  # front face at -Y half-depth, plus extrude

    # Gradient material along the diagonal (object X) for sky->amber.
    gmat = bpy.data.materials.new("MonogramGrad")
    gmat.use_nodes = True
    gnt = gmat.node_tree
    gnt.nodes.clear()
    texco = gnt.nodes.new("ShaderNodeTexCoord")
    sep = gnt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = gnt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = SKY_L
    ramp.color_ramp.elements[1].position = 0.65
    ramp.color_ramp.elements[1].color = AMBER_L
    bsdf = gnt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.18
    out = gnt.nodes.new("ShaderNodeOutputMaterial")
    gnt.links.new(texco.outputs["Generated"], sep.inputs["Vector"])
    gnt.links.new(sep.outputs["X"], ramp.inputs["Fac"])
    gnt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    # Add emission so the letters glow slightly against the dark tile.
    gnt.links.new(ramp.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 0.35
    gnt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    txt.data.materials.append(gmat)

    # ── Lighting: key from upper-front, rim/fill in brand colors ────
    # Camera looks down -Y, so lights live on the -Y (front) side.
    bpy.ops.object.light_add(type="AREA", location=(2.6, -4.0, 3.2))
    key = bpy.context.active_object
    key.data.energy = 1400
    key.data.size = 7
    key.rotation_euler = (math.radians(38), 0, math.radians(30))

    bpy.ops.object.light_add(type="AREA", location=(-3.6, -3.0, 1.2))
    rim = bpy.context.active_object
    rim.data.energy = 700
    rim.data.size = 5
    rim.data.color = SKY_L[:3]
    rim.rotation_euler = (math.radians(70), 0, math.radians(-40))

    bpy.ops.object.light_add(type="AREA", location=(3.6, -2.5, -1.0))
    fill = bpy.context.active_object
    fill.data.energy = 450
    fill.data.size = 5
    fill.data.color = AMBER_L[:3]
    fill.rotation_euler = (math.radians(100), 0, math.radians(40))

    # ── Camera: straight-on for the tile, framed centered ───────────
    bpy.ops.object.camera_add(location=(0, -6.2, 0))
    cam = bpy.context.active_object
    cam.data.lens = 90
    cam.rotation_euler = (math.radians(90), 0, 0)
    if MODE == "og":
        # Push subject left so wordmark text can occupy the right in CSS.
        cam.location = (-0.9, -6.2, 0)
    scene.camera = cam

    # ── Render ──────────────────────────────────────────────────────
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = OUT
    bpy.ops.render.render(write_still=True)
    print("WROTE", OUT)


build()
