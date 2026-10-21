"""Loft Concept hero: old timber house -> demolition -> dig -> foundation -> frame -> facade -> finished home.

Run headless:
  Blender -b -P build_hero.py -- <portrait|landscape> <out_dir> [still_frame]
"""
import bpy, math, random, sys
from math import radians, sin, cos, pi, atan2
from mathutils import Matrix

random.seed(11)
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = args[0] if len(args) > 0 else 'portrait'
OUT = args[1] if len(args) > 1 else '/tmp/hero'
RANGE = None
STILL = None
if len(args) > 2:
    if '-' in args[2]:
        RANGE = tuple(int(v) for v in args[2].split('-'))
    else:
        STILL = int(args[2])
FPS, DUR = 24, 8.0
NF = int(FPS * DUR)
F = lambda t: 1 + round(t * FPS)
lerp = lambda a, b, t: a + (b - a) * t
smooth = lambda t: t * t * (3 - 2 * t)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, NF
scene.render.fps = FPS


# ---------------------------------------------------------------- materials
def hexc(h):
    h = h.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)


def mat(name, color, rough=0.6, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexc(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = hexc(emit)
        b.inputs['Emission Strength'].default_value = es
    return m


def tex_mat(name, kind, c1, c2, scale, rough=0.7):
    m = mat(name, c1, rough)
    n, l = m.node_tree.nodes, m.node_tree.links
    b = n['Principled BSDF']
    tc = n.new('ShaderNodeTexCoord')
    if kind == 'planks':
        t = n.new('ShaderNodeTexWave')
        t.wave_type, t.bands_direction = 'BANDS', 'Z'
        t.inputs['Scale'].default_value = scale
        t.inputs['Distortion'].default_value = 0.0
        l.new(tc.outputs['Object'], t.inputs['Vector'])
        cr = n.new('ShaderNodeValToRGB')
        cr.color_ramp.elements[0].color = hexc(c2)
        cr.color_ramp.elements[1].color = hexc(c1)
        cr.color_ramp.elements[0].position = 0.45
        cr.color_ramp.elements[1].position = 0.55
        l.new(t.outputs['Fac'], cr.inputs['Fac'])
        l.new(cr.outputs['Color'], b.inputs['Base Color'])
    elif kind == 'marble':
        t = n.new('ShaderNodeTexNoise')
        t.inputs['Scale'].default_value = scale
        t.inputs['Detail'].default_value = 8.0
        t.inputs['Distortion'].default_value = 1.2
        l.new(tc.outputs['Object'], t.inputs['Vector'])
        cr = n.new('ShaderNodeValToRGB')
        cr.color_ramp.elements[0].color = hexc(c2)
        cr.color_ramp.elements[1].color = hexc(c1)
        l.new(t.outputs['Fac'], cr.inputs['Fac'])
        l.new(cr.outputs['Color'], b.inputs['Base Color'])
    elif kind == 'jaali':
        t = n.new('ShaderNodeTexChecker')
        t.inputs['Scale'].default_value = scale
        t.inputs['Color1'].default_value = hexc(c1)
        t.inputs['Color2'].default_value = hexc(c2)
        l.new(tc.outputs['Object'], t.inputs['Vector'])
        l.new(t.outputs['Color'], b.inputs['Base Color'])
    return m


M = dict(
    grass=mat('grass', '#86a066', 0.95), paving=mat('paving', '#d4ccbd', 0.9),
    soil=mat('soil', '#8a6a4d', 1.0), soil_dark=mat('soil_dark', '#6e5039', 1.0),
    base=mat('base', '#b79a76', 1.0), floor=mat('floor', '#e4dac6', 1.0),
    planks=tex_mat('planks', 'planks', '#f1ece2', '#cfc8b8', 34),
    zinc=mat('zinc', '#a9b1b4', 0.35, 0.8), stilt=mat('stilt', '#d9d3c7', 0.9),
    wood=mat('wood', '#7a5a3c', 0.8), glass_dark=mat('glass_dark', '#6f8a92', 0.1, 0.0),
    concrete=mat('concrete', '#cfcac1', 0.9), concrete_wet=mat('concrete_wet', '#b9b4aa', 0.5),
    rebar=mat('rebar', '#5a4a3a', 0.7, 0.4), steel=mat('steel', '#24211e', 0.5, 0.3),
    wall=mat('wall', '#34373a', 0.8), slab=mat('slab', '#c9c4ba', 0.85),
    yellow=mat('yellow', '#e3a817', 0.5), dark=mat('dark', '#2a2a2a', 0.8),
    glass_cab=mat('glass_cab', '#7fa3b0', 0.1), white=mat('white', '#efeee9', 0.7),
    orange=mat('orange', '#e8772a', 0.6), vest=mat('vest', '#f26b1d', 0.6),
    skin=mat('skin', '#e0b48c', 0.8), pants=mat('pants', '#2f3b52', 0.9),
    jaali=tex_mat('jaali', 'jaali', '#b55f3d', '#3a2418', 14, 0.8),
    marble=tex_mat('marble', 'marble', '#bfc2c4', '#6c7075', 2.2, 0.25),
    black=mat('black', '#161412', 0.5, 0.2), scaffold=mat('scaffold', '#b39d78', 0.6, 0.4),
    leaf=mat('leaf', '#4d7a3c', 0.8), leaf2=mat('leaf2', '#6a9448', 0.8),
    trunk=mat('trunk', '#6b4f35', 0.9), dust=mat('dust', '#f0e8d9', 1.0),
    flower1=mat('flower1', '#8a63b5', 0.7), flower2=mat('flower2', '#e0a830', 0.7),
    backdrop=mat('backdrop', '#e9e0cf', 1.0),
)
GLASS_LIT = mat('glass_lit', '#6f8a92', 0.1, 0.0, emit='#ffd69a', es=0.0)
M['glass'] = GLASS_LIT


# ---------------------------------------------------------------- geometry
def link(ob):
    scene.collection.objects.link(ob)
    return ob


def bevel(ob, w=0.05):
    md = ob.modifiers.new('bev', 'BEVEL')
    md.width, md.segments, md.limit_method = w, 2, 'ANGLE'


CUBE_F = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]


def box(name, x, y, z, w, d, h, m, bev=0.05):
    """Box centred on (x, y) with its base at z. Origin is the base centre, so scaling z grows it upward."""
    hx, hy = w / 2, d / 2
    v = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (-hx, -hy, h), (hx, -hy, h), (hx, hy, h), (-hx, hy, h)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], CUBE_F)
    me.update()
    ob = link(bpy.data.objects.new(name, me))
    ob.location = (x, y, z)
    ob.data.materials.append(m)
    if bev:
        bevel(ob, bev)
    return ob


def multibox(name, specs, m, origin):
    """Many boxes in one mesh. specs are world-space (cx, cy, zbase, w, d, h)."""
    ox, oy, oz = origin
    v, f = [], []
    for (x, y, z, w, d, h) in specs:
        i, hx, hy = len(v), w / 2, d / 2
        x, y, z = x - ox, y - oy, z - oz
        v += [(x - hx, y - hy, z), (x + hx, y - hy, z), (x + hx, y + hy, z), (x - hx, y + hy, z),
              (x - hx, y - hy, z + h), (x + hx, y - hy, z + h), (x + hx, y + hy, z + h), (x - hx, y + hy, z + h)]
        f += [tuple(i + k for k in q) for q in CUBE_F]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.update()
    ob = link(bpy.data.objects.new(name, me))
    ob.location = origin
    ob.data.materials.append(m)
    return ob


def sphere(name, x, y, z, r, m, sx=1, sy=1, sz=1, seg=14):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=(x, y, z))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (sx, sy, sz)
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.materials.append(m)
    return ob


def cylinder(name, x, y, z, r, h, m, rot=(0, 0, 0), seg=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=h, location=(x, y, z))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.transform(Matrix.Translation((0, 0, h / 2)))
    ob.rotation_euler = rot
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.materials.append(m)
    return ob


def empty(name, loc=(0, 0, 0), parent=None):
    e = link(bpy.data.objects.new(name, None))
    e.location = loc
    if parent:
        e.parent = parent
    return e


def adopt(parent, *objs):
    for o in objs:
        o.parent = parent


# ---------------------------------------------------------------- animation helpers
def _keys(ob, attr, keys):
    last = None
    for t, val in keys:
        fr = F(t)
        if fr == last:
            continue
        last = fr
        setattr(ob, attr, val)
        ob.keyframe_insert(attr, frame=fr)


def skeys(ob, keys): _keys(ob, 'scale', keys)
def lkeys(ob, keys): _keys(ob, 'location', keys)
def rkeys(ob, keys): _keys(ob, 'rotation_euler', keys)


def tiny(b, mode):
    e = 1e-3
    return {'z': (b[0], b[1], e), 'all': (e, e, e), 'x': (e, b[1], b[2]), 'y': (b[0], e, b[2])}[mode]


def grow(ob, t0, t1, mode='z', out=None, out_mode=None):
    b = tuple(ob.scale)
    z = tiny(b, mode)
    allz = tiny(b, 'all')
    ks = [(0, allz), (max(0, t0 - 1.5 / FPS), allz), (t0, z), (t1, b)]
    if out:
        ks += [(out[0], b), (out[1], tiny(b, out_mode or mode))]
    skeys(ob, ks)


def pop_group(objs, t0, step, dur, mode='z'):
    for i, o in enumerate(objs):
        grow(o, t0 + i * step, t0 + i * step + dur, mode)


# ---------------------------------------------------------------- site
PX, PY = 9.0, 8.0          # plot half-extents
PIT = (-5.4, 5.4, -1.4, 6.4)  # x0, x1, y0, y1
DEPTH = 1.6
HX0, HX1, HY0, HY1 = -5.0, 5.0, -1.0, 6.0   # new house footprint

# backdrop and base
box('backdrop', 0, 0, -2.2, 6000, 6000, 0.2, M['backdrop'], bev=0)
box('base', 0, 0, -2.0, 2 * PX, 2 * PY, DEPTH * 0.25, M['base'], bev=0.12)
ground_blocks = [
    ('gA', (-PX + (PX - 5.4) / 2 + 0, 0), (PX - 5.4, 2 * PY), M['grass']),
]
x0, x1, y0, y1 = PIT


def ground(name, cx, cy, w, d, top_m):
    box(name + '_soil', cx, cy, -2.0, w, d, 1.88, M['soil'], bev=0.04)
    box(name + '_top', cx, cy, -0.12, w, d, 0.12, top_m, bev=0.03)


ground('gL', (-PX + x0) / 2, 0, x0 + PX, 2 * PY, M['grass'])
ground('gR', (PX + x1) / 2, 0, PX - x1, 2 * PY, M['grass'])
ground('gF', (x0 + x1) / 2, (-PY + y0) / 2, x1 - x0, y0 + PY, M['paving'])
ground('gB', (x0 + x1) / 2, (PY + y1) / 2, x1 - x0, PY - y1, M['grass'])
# pit floor and the soil plug that sinks to open the pit
box('pitbase', (x0 + x1) / 2, (y0 + y1) / 2, -2.0, x1 - x0, y1 - y0, 0.4, M['soil_dark'], bev=0)
plug = box('plug', (x0 + x1) / 2, (y0 + y1) / 2, -DEPTH, x1 - x0 - 0.02, y1 - y0 - 0.02, DEPTH, M['soil_dark'], bev=0)
plug_top = box('plug_top', (x0 + x1) / 2, (y0 + y1) / 2, -0.12, x1 - x0 - 0.02, y1 - y0 - 0.02, 0.12, M['paving'], bev=0.03)
adopt(plug, plug_top)
plug_top.location = (0, 0, DEPTH - 0.12)
SINK = (2.45, 3.6)
lkeys(plug, [(0, (plug.location.x, plug.location.y, -DEPTH)), (SINK[0], (plug.location.x, plug.location.y, -DEPTH)),
             (SINK[1], (plug.location.x, plug.location.y, -DEPTH - 1.38))])
# plug top face is a thin paving cap; make it read as soil once the old house is gone
plug_top.data.materials[0] = M['grass']


# ---------------------------------------------------------------- old timber house (0 to ~2.4s)
old = []
stilts = []
for sx in (-3.3, 0, 2.9):
    for sy in (0.6, 4.2):
        stilts.append(box('stilt', sx, sy, 0, 0.3, 0.3, 1.15, M['stilt'], bev=0.02))
body = box('old_body', -0.2, 2.4, 1.1, 6.6, 4.2, 2.2, M['planks'], bev=0.03)
roof = box('old_roof', -0.2, 2.4, 3.3, 7.6, 5.4, 0.28, M['zinc'], bev=0.03)
roof.rotation_euler.x = radians(5)
porch = box('old_porch', -0.2, -0.5, 1.1, 6.6, 1.4, 0.12, M['planks'], bev=0.02)
steps = [box('step', -1.6, -1.6 - i * 0.42, 0, 1.3, 0.42, 1.1 - i * 0.22, M['stilt'], bev=0.02) for i in range(5)]
rails = multibox('old_rail', [(-3.3 + i * 0.4, -1.1, 1.22, 0.06, 0.06, 0.9) for i in range(17)], M['white'], (-0.2, -1.1, 1.22))
wins = [box('old_win', wx, 0.27, 1.9, 1.0, 0.06, 1.0, M['glass_dark'], bev=0.01) for wx in (-2.8, -1.2, 1.7)]
door = box('old_door', 0.2, 0.27, 1.1, 0.9, 0.06, 1.9, M['dark'], bev=0.01)
old_all = stilts + [body, roof, porch] + steps + [rails] + wins + [door]
# Collapse: roof tilts and drops first, walls sink, then everything disappears.
rkeys(roof, [(0, (radians(5), 0, 0)), (1.25, (radians(5), 0, 0)), (1.9, (radians(32), 0, radians(6)))])
lkeys(roof, [(0, tuple(roof.location)), (1.25, tuple(roof.location)), (1.9, (roof.location.x + 0.6, roof.location.y, 0.4))])
skeys(roof, [(0, (1, 1, 1)), (1.9, (1, 1, 1)), (2.35, (1e-3,) * 3)])
for o in [body, porch] + wins + [door]:
    b = tuple(o.scale)
    base = tuple(o.location)
    skeys(o, [(0, b), (1.35, b), (2.1, (b[0], b[1], 0.04)), (2.35, (1e-3,) * 3)])
    lkeys(o, [(0, base), (1.35, base), (2.0, (base[0], base[1], 0.15))])
for o in stilts + steps + [rails]:
    b = tuple(o.scale)
    skeys(o, [(0, b), (1.7, b), (2.4, (1e-3,) * 3)])
# wobble the walls before they drop
rkeys(body, [(0, (0, 0, 0)), (1.2, (0, 0, 0)), (1.35, (0, 0, radians(0.8))), (1.5, (0, 0, radians(-0.8))), (1.65, (0, 0, radians(0.5))), (1.8, (0, 0, 0))])

# dust and debris
for i, (dx, dy, dz, t) in enumerate([(-3, 1, 1.2, 1.3), (0, 0.2, 1.5, 1.4), (2.8, 2, 1.3, 1.5), (-1.5, 4.4, 1.5, 1.45), (1.8, 4.6, 1.2, 1.6), (-3.4, 3.4, 1.0, 1.55), (0.5, 2.5, 2.0, 1.7), (3.2, 0.8, 1.2, 1.75)]):
    d = sphere('dust', dx, dy, dz, 1.0, M['dust'], seg=10)
    skeys(d, [(0, (1e-3,) * 3), (t, (1e-3,) * 3), (t + 0.55, (1.7, 1.7, 1.2)), (t + 1.25, (1e-3,) * 3)])
    lkeys(d, [(0, (dx, dy, dz)), (t, (dx, dy, dz)), (t + 1.25, (dx, dy + 0.3, dz + 1.4))])
for i in range(10):
    px, py = random.uniform(-3.5, 3.2), random.uniform(0.2, 4.4)
    p = box('plank', px, py, 1.6, random.uniform(1.0, 1.8), 0.14, 0.05, M['planks'], bev=0)
    p.rotation_euler = (random.uniform(-.5, .5), random.uniform(-.5, .5), random.uniform(0, 3))
    skeys(p, [(0, (1e-3,) * 3), (1.4 + i * 0.03, (1e-3,) * 3), (1.45 + i * 0.03, (1, 1, 1)), (2.35, (1, 1, 1)), (2.6, (1e-3,) * 3)])
    lkeys(p, [(0, (px, py, 1.6)), (1.4 + i * 0.03, (px, py, 1.6)), (2.1, (px + random.uniform(-.5, .5), py + random.uniform(-.5, .5), 0.05))])


# ---------------------------------------------------------------- machines
def excavator(x, y, rotz, name='EXC'):
    root = empty(name, (x, y, 0))
    root.rotation_euler.z = rotz
    parts = [
        box('trk1', 0, 0.95, 0, 3.2, 0.75, 0.75, M['dark'], 0.08), box('trk2', 0, -0.95, 0, 3.2, 0.75, 0.75, M['dark'], 0.08),
        box('exb', -0.2, 0, 0.7, 2.6, 2.2, 0.9, M['yellow'], 0.08), box('cab', 0.5, 0.5, 1.6, 1.2, 1.0, 1.1, M['glass_cab'], 0.06),
        box('cwt', -1.6, 0, 0.8, 0.8, 1.9, 0.8, M['dark'], 0.06),
    ]
    adopt(root, *parts)
    p1 = empty('boom_p', (0.9, 0, 1.55), root)
    boom = box('boom', 1.7, 0, -0.2, 3.4, 0.5, 0.55, M['yellow'], 0.05)
    boom.parent = p1
    boom.location = (1.7, 0, -0.25)
    p2 = empty('stick_p', (3.3, 0, 0.0), p1)
    stick = box('stick', 1.3, 0, -0.18, 2.6, 0.38, 0.42, M['yellow'], 0.05)
    stick.parent = p2
    stick.location = (1.3, 0, -0.2)
    p3 = empty('bucket_p', (2.55, 0, 0), p2)
    bucket = box('bucket', 0.25, 0, -0.8, 0.9, 1.0, 0.8, M['dark'], 0.06)
    bucket.parent = p3
    bucket.location = (0.25, 0, -0.8)
    return root, p1, p2, p3


def worker(name, x, y, z, vest='vest'):
    root = empty(name, (x, y, z))
    parts = [box(name + '_l', 0, 0, 0, 0.34, 0.2, 0.5, M['pants'], 0.02), box(name + '_t', 0, 0, 0.5, 0.42, 0.26, 0.62, M[vest], 0.03),
             sphere(name + '_h', 0, 0, 1.26, 0.14, M['skin'], seg=10), sphere(name + '_hh', 0, 0, 1.31, 0.165, M['white'], sz=0.75, seg=10)]
    for p in parts:
        p.location = (p.location.x, p.location.y, p.location.z)
    adopt(root, *parts)
    return root


def walk(root, pts, appear, vanish, s=1.5):
    """pts: [(t, x, y, z)]. Linear walking with a small bob; heading follows travel direction."""
    t_first, t_last = pts[0][0], pts[-1][0]
    skeys(root, [(0, (1e-3,) * 3), (appear, (1e-3,) * 3), (appear + 0.25, (s, s, s)), (vanish - 0.25, (s, s, s)), (vanish, (1e-3,) * 3)])
    heading = 0.0
    x, y, z = pts[0][1:]
    fr0, fr1 = F(t_first), F(t_last)
    for fr in range(fr0, fr1 + 1, 3):
        t = min(max((fr - 1) / FPS, t_first), t_last)
        for a, b in zip(pts, pts[1:]):
            if a[0] <= t <= b[0]:
                u = (t - a[0]) / max(1e-6, b[0] - a[0])
                x, y, z = [lerp(a[i], b[i], u) for i in (1, 2, 3)]
                moving = abs(b[1] - a[1]) + abs(b[2] - a[2]) > 1e-3
                if moving:
                    heading = atan2(b[2] - a[2], b[1] - a[1]) - pi / 2
                    z += 0.05 * abs(sin(t * 14))
                break
        root.location = (x, y, z)
        root.rotation_euler = (0, 0, heading)
        root.keyframe_insert('location', frame=fr)
        root.keyframe_insert('rotation_euler', frame=fr)


# excavator digs 2.4 to 3.7
exc, p1, p2, p3 = excavator(7.6, 2.4, pi)
exc.scale = (0.85, 0.85, 0.85)
grow(exc, 1.9, 2.3, 'all', out=(3.7, 4.05))
rkeys(p1, [(0, (0, -0.35, 0)), (2.4, (0, -0.35, 0)), (2.7, (0, 0.30, 0)), (3.0, (0, -0.45, 0)), (3.3, (0, 0.30, 0)), (3.6, (0, -0.4, 0))])
rkeys(p2, [(0, (0, 0.3, 0)), (2.4, (0, 0.3, 0)), (2.7, (0, 0.95, 0)), (3.0, (0, 0.1, 0)), (3.3, (0, 0.95, 0)), (3.6, (0, 0.1, 0))])
rkeys(p3, [(0, (0, 0.2, 0)), (2.7, (0, 0.5, 0)), (3.0, (0, -0.4, 0)), (3.3, (0, 0.5, 0)), (3.6, (0, -0.3, 0))])
mound = sphere('spoil', 7.6, -2.8, 0, 1.5, M['soil'], 1.5, 1.2, 0.6)
skeys(mound, [(0, (1e-3,) * 3), (2.6, (1e-3,) * 3), (3.7, (1.5, 1.2, 0.6)), (3.9, (1.5, 1.2, 0.6)), (4.3, (1e-3,) * 3)])

# cement mixer 3.7 to 5.1
truck = empty('truck', (-7.3, 2.6, 0))
truck.rotation_euler.z = radians(90)
tp = [box('chassis', 0, 0, 0.6, 5.2, 2.2, 0.35, M['dark'], 0.05), box('tcab', 2.0, 0, 0.95, 1.4, 2.0, 1.7, M['white'], 0.08),
      box('twin', 2.7, 0, 1.6, 0.06, 1.7, 0.8, M['glass_cab'], 0.0)]
drum = cylinder('drum', -0.9, 0, 1.0, 1.1, 3.0, M['orange'], rot=(0, radians(80), 0))
drum.location = (-2.5, 0, 1.9)
tp.append(drum)
for wx in (-1.8, -0.4, 2.1):
    for wy in (-1.0, 1.0):
        tp.append(cylinder('wheel', wx, wy - (0.14 if wy < 0 else -0.14), 0.45, 0.45, 0.28, M['dark'], rot=(radians(90), 0, 0)))
adopt(truck, *tp)
truck.scale = (0.85, 0.85, 0.85)
grow(truck, 3.7, 4.05, 'all', out=(4.95, 5.3))
rkeys(drum, [(0, (0, radians(80), 0)), (NF / FPS, (0, radians(80), 12.0))])

# tower crane 4.5 to 7.4
crane = empty('crane', (7.4, 6.9, 0))
tower = box('tower', 0, 0, 0, 0.7, 0.7, 13.0, M['yellow'], 0.04)
cab = box('ccab', 0.5, 0, 11.4, 1.0, 1.0, 1.0, M['white'], 0.05)
adopt(crane, tower, cab)
jib_p = empty('jib_p', (0, 0, 13.0), crane)
jib = box('jib', -2.25, 0, 0, 17.5, 0.5, 0.45, M['yellow'], 0.03)
cw = box('cw', 5.2, 0, -0.1, 1.6, 0.9, 0.9, M['dark'], 0.03)
hookl = box('hookl', -8.0, 0, -5.0, 0.05, 0.05, 5.0, M['dark'], 0)
load = box('load', -8.0, 0, -5.6, 1.6, 0.5, 0.5, M['steel'], 0.03)
adopt(jib_p, jib, cw, hookl, load)
jib.location, cw.location, hookl.location, load.location = (-2.25, 0, 0), (5.2, 0, -0.1), (-8.0, 0, -5.0), (-8.0, 0, -5.6)
grow(crane, 4.4, 5.0, 'all', out=(7.0, 7.5), out_mode='all')
rkeys(jib_p, [(0, (0, 0, radians(30))), (4.5, (0, 0, radians(30))), (6.0, (0, 0, radians(-5))), (7.4, (0, 0, radians(-40)))])
lkeys(load, [(0, tuple(load.location)), (5.0, tuple(load.location)), (5.6, (-8.0, 0, -3.0)), (6.2, (-8.0, 0, -5.6))])
lkeys(hookl, [(0, tuple(hookl.location)), (5.0, tuple(hookl.location)), (5.6, (-8.0, 0, -2.5)), (6.2, (-8.0, 0, -5.0))])

# ---------------------------------------------------------------- foundation 3.6 to 4.8
rebar_specs = []
for i in range(15):
    rebar_specs.append(((x0 + x1) / 2, y0 + 0.4 + i * 0.5, -1.35, (x1 - x0) - 0.6, 0.07, 0.07))
for i in range(22):
    rebar_specs.append((x0 + 0.5 + i * 0.5, (y0 + y1) / 2, -1.28, 0.07, (y1 - y0) - 0.6, 0.07))
rebar = multibox('rebar', rebar_specs, M['rebar'], ((x0 + x1) / 2, (y0 + y1) / 2, -1.35))
grow(rebar, 3.5, 4.1, 'all', out=(4.6, 4.8))
pour = box('pour', (x0 + x1) / 2, (y0 + y1) / 2, -DEPTH + 0.2, x1 - x0 - 0.1, y1 - y0 - 0.1, DEPTH - 0.2, M['concrete_wet'], 0.0)
grow(pour, 4.0, 4.8, 'z')
slab0 = box('slab0', (x0 + x1) / 2, (y0 + y1) / 2, -0.12, x1 - x0 - 0.1, y1 - y0 - 0.1, 0.12, M['concrete'], 0.02)
grow(slab0, 4.75, 4.82, 'z')

# ---------------------------------------------------------------- structure 4.8 to 6.1
cols_x = (-4.85, -1.65, 1.65, 4.85)
cols_y = (-0.85, 2.5, 5.85)
cols1, cols2 = [], []
i = 0
for cx in cols_x:
    for cy in cols_y:
        c1 = box('col1', cx, cy, 0, 0.32, 0.32, 3.2, M['steel'], 0.02)
        c2 = box('col2', cx, cy, 3.5, 0.32, 0.32, 3.0, M['steel'], 0.02)
        grow(c1, 4.8 + i * 0.03, 5.15 + i * 0.03, 'z')
        grow(c2, 5.45 + i * 0.03, 5.8 + i * 0.03, 'z')
        i += 1
slab1 = box('slab1', 0, 2.5, 3.2, 10.8, 7.8, 0.3, M['slab'], 0.03)
slab2 = box('slab2', 0, 2.5, 6.5, 10.8, 7.8, 0.3, M['slab'], 0.03)
for s, t in ((slab1, 5.15), (slab2, 5.8)):
    b = tuple(s.location)
    lkeys(s, [(0, (b[0], b[1], b[2] + 3.5)), (t, (b[0], b[1], b[2] + 3.5)), (t + 0.4, b)])
    skeys(s, [(0, (1e-3,) * 3), (t, (1e-3,) * 3), (t + 0.05, (1, 1, 1))])

# ---------------------------------------------------------------- facade 6.0 to 7.0
walls = []
for lvl, z0 in ((1, 0.0), (2, 3.5)):
    h = 3.2 if lvl == 1 else 3.0
    walls += [box('wf', 0, HY0 + 0.12, z0, 10.0, 0.25, h, M['wall'], 0.02), box('wb', 0, HY1 - 0.12, z0, 10.0, 0.25, h, M['wall'], 0.02),
              box('wl', HX0 + 0.12, 2.5, z0, 0.25, 6.5, h, M['wall'], 0.02), box('wr', HX1 - 0.12, 2.5, z0, 0.25, 6.5, h, M['wall'], 0.02)]
pop_group(walls, 6.0, 0.05, 0.35, 'z')
glass_objs = []
for z0, h in ((0.5, 2.2), (3.9, 2.2)):
    for gx in (-3.5, 3.4):
        glass_objs.append(box('gl', gx, HY0 - 0.02, z0, 2.6, 0.06, h, M['glass'], 0.0))
    glass_objs.append(box('glr', HX1 + 0.02, 2.0, z0, 0.06, 3.2, h, M['glass'], 0.0))
pop_group(glass_objs, 6.2, 0.06, 0.3, 'z')
jaali_objs = []
for z0 in (0.5, 3.9):
    for jx in (-0.4, 0.55):
        jaali_objs.append(box('ja', jx, HY0 - 0.06, z0, 1.2, 0.1, 2.2, M['jaali'], 0.0))
    jaali_objs.append(box('jar', HX1 + 0.06, 4.6, z0, 0.1, 1.4, 2.2, M['jaali'], 0.0))
pop_group(jaali_objs, 6.35, 0.06, 0.3, 'x')
fins = multibox('fins', [(-4.6 + i * 0.42, HY0 - 0.5, 3.5, 0.1, 0.34, 3.0) for i in range(8)], M['black'], (-3.2, HY0 - 0.5, 3.5))
grow(fins, 6.5, 6.9, 'x')
# balcony railings + roof parapet
rail1 = multibox('rail1', [(-5.3 + i * 0.3, HY0 - 0.38, 3.5, 0.05, 0.05, 1.05) for i in range(36)] + [(0, HY0 - 0.38, 4.5, 10.8, 0.07, 0.06)], M['black'], (0, HY0 - 0.38, 3.5))
grow(rail1, 6.4, 6.8, 'z')
roof_specs = []
for i in range(36):
    roof_specs.append((-5.3 + i * 0.3, -1.3, 6.8, 0.05, 0.05, 1.0))
    roof_specs.append((-5.3 + i * 0.3, 6.3, 6.8, 0.05, 0.05, 1.0))
for j in range(26):
    roof_specs.append((-5.35, -1.3 + j * 0.3, 6.8, 0.05, 0.05, 1.0))
    roof_specs.append((5.35, -1.3 + j * 0.3, 6.8, 0.05, 0.05, 1.0))
roof_specs += [(0, -1.3, 7.75, 10.8, 0.07, 0.06), (0, 6.3, 7.75, 10.8, 0.07, 0.06), (-5.35, 2.5, 7.75, 0.07, 7.8, 0.06), (5.35, 2.5, 7.75, 0.07, 7.8, 0.06)]
parapet = multibox('parapet', roof_specs, M['black'], (0, 2.5, 6.8))
grow(parapet, 6.2, 6.7, 'z')
deck = box('deck', 0, 2.5, 6.8, 10.6, 7.6, 0.06, M['wood'], 0.0)
grow(deck, 6.0, 6.3, 'z')
pav1 = box('pav1', -1.2, 3.2, 6.86, 3.0, 2.8, 2.5, M['white'], 0.04)
pav1g = box('pav1g', -1.2, 1.78, 6.9, 2.4, 0.06, 2.1, M['glass'], 0.0)
pav1r = box('pav1r', -1.2, 3.2, 9.36, 3.5, 3.3, 0.22, M['black'], 0.03)
pav2 = box('pav2', 2.8, 4.8, 6.86, 2.2, 1.8, 1.9, M['white'], 0.04)
pav2r = box('pav2r', 2.8, 4.8, 8.76, 2.7, 2.3, 0.2, M['black'], 0.03)
pop_group([pav1, pav1g, pav1r, pav2, pav2r], 6.5, 0.08, 0.35, 'z')
# front gate wall: marble piers and black fence
piers = [box('pier', px, -7.2, 0, 2.1, 0.4, 2.3, M['marble'], 0.03) for px in (-6.6, -1.0, 4.6)]
pop_group(piers, 6.5, 0.1, 0.4, 'z')
fence = multibox('fence', [(-8.8 + i * 0.32, -7.2, 0, 0.07, 0.07, 1.9) for i in range(56)] + [(0.0, -7.2, 1.8, 17.8, 0.07, 0.1)], M['black'], (0, -7.2, 0))
grow(fence, 6.9, 7.4, 'z')
# scaffold, up then away
sc = []
for sx in (-5.6, -2.8, 0, 2.8, 5.6):
    sc.append((sx, -2.0, 0, 0.08, 0.08, 7.4))
for z in (1.8, 3.6, 5.4, 7.2):
    sc.append((0, -2.0, z, 11.4, 0.08, 0.08))
    sc.append((0, -1.7, z, 11.4, 0.5, 0.05))
scaf = multibox('scaffold', sc, M['scaffold'], (0, -2.0, 0))
grow(scaf, 5.6, 6.0, 'z', out=(6.95, 7.3), out_mode='all')

# ---------------------------------------------------------------- finishing 7.0 to 8.0
palms = []
for (px, py, hh) in ((-8.0, 6.5, 4.2), (8.0, -5.5, 3.6), (8.2, 4.5, 4.8), (-8.2, -4.0, 3.2), (-2.0, 7.4, 5.2), (3.5, 7.5, 4.4)):
    tr = cylinder('trunk', px, py, 0, 0.16, hh, M['trunk'], seg=8)
    fr = []
    for k in range(7):
        a = k * 2 * pi / 7
        lf = box('frond', px, py, hh, 2.2, 0.35, 0.05, M['leaf'], 0)
        lf.location = (px + cos(a) * 1.0, py + sin(a) * 1.0, hh - 0.2)
        lf.rotation_euler = (0, radians(-15), a)
        fr.append(lf)
    adopt(tr, *fr)
    for lf in fr:
        lf.location = (lf.location.x - px, lf.location.y - py, lf.location.z - 0)
    palms.append(tr)
for i, p in enumerate(palms):
    grow(p, 6.9 + i * 0.09, 7.5 + i * 0.09, 'all')
shrubs = []
for i in range(26):
    sx = random.uniform(-7.2, -2.4) if i < 18 else random.uniform(2.6, 7.4)
    sy = random.uniform(-6.4, -4.2)
    shrubs.append(sphere('shrub', sx, sy, 0.25, random.uniform(0.35, 0.6), M['leaf2'] if i % 2 else M['leaf'], seg=8))
    if i % 3 == 0:
        shrubs.append(sphere('flw', sx + 0.15, sy - 0.1, 0.55, 0.16, M['flower1'] if i % 2 else M['flower2'], seg=6))
for i, s in enumerate(shrubs):
    grow(s, 7.0 + (i % 12) * 0.05, 7.4 + (i % 12) * 0.05, 'all')
roofplants = [sphere('rp', px, py, 7.1, 0.5, M['leaf'], 1, 1, 0.8, seg=8) for px, py in ((-4.6, 5.6), (4.6, 5.8), (-4.8, 0.2), (4.8, 0.4), (0.4, 5.9))]
for i, s in enumerate(roofplants):
    grow(s, 7.1 + i * 0.07, 7.5 + i * 0.07, 'all')
# lights come on
em = GLASS_LIT.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
em.default_value = 0.0
em.keyframe_insert('default_value', frame=F(6.9))
em.default_value = 1.8
em.keyframe_insert('default_value', frame=F(7.7))

# crew
walk(worker('w1', -6.5, -3.5, 0), [(1.1, -7.2, -5.0, 0), (2.0, -6.8, -1.2, 0), (3.2, -6.8, 3.0, 0), (3.9, -6.6, 6.0, 0)], 1.0, 4.0)
walk(worker('w2', 6.6, 4.2, 0), [(1.8, 6.4, 5.2, 0), (2.6, 6.2, 3.6, 0), (3.4, 6.5, 1.0, 0), (3.9, 6.5, 0.0, 0)], 1.8, 3.95)
walk(worker('w3', 6.0, -2.2, 0), [(2.2, 6.2, -3.0, 0), (3.0, 6.0, -1.0, 0), (3.6, 6.0, -1.0, 0)], 2.2, 3.7)
walk(worker('w4', -2.0, 7.0, 0), [(3.6, -3.0, 7.2, 0), (4.4, 1.0, 7.2, 0), (5.2, 5.0, 7.2, 0)], 3.6, 5.3)
walk(worker('w5', -4.8, 0.0, 3.5), [(5.4, -4.4, -0.4, 3.5), (6.0, -1.0, -0.4, 3.5), (6.5, 3.0, -0.4, 3.5)], 5.4, 6.6)
walk(worker('w6', 4.4, 5.0, 6.8), [(5.9, 4.4, 5.0, 6.8), (6.5, 1.0, 5.2, 6.8), (7.0, -3.0, 5.2, 6.8)], 5.9, 7.6)
walk(worker('w7', -3.2, -2.5, 0), [(5.0, -4.5, -3.0, 0), (5.6, -1.0, -3.0, 0), (6.2, 3.0, -3.0, 0), (6.8, 5.0, -3.0, 0)], 5.0, 6.9)
walk(worker('w8', -4.0, 3.5, 3.5), [(5.5, -3.0, 4.0, 3.5), (6.2, 0.0, 4.0, 3.5), (6.8, 3.0, 3.0, 3.5)], 5.5, 6.9)
walk(worker('jogger', -8.5, -5.8, 0, 'white'), [(7.2, -8.4, -5.8, 0), (8.0, 8.4, -5.8, 0)], 7.2, 8.05)

# ---------------------------------------------------------------- camera, light, world
tgt = empty('tgt', (0, 2.0, 1.0))
cam_d = bpy.data.cameras.new('cam')
cam = link(bpy.data.objects.new('cam', cam_d))
scene.camera = cam
con = cam.constraints.new('TRACK_TO')
con.target, con.track_axis, con.up_axis = tgt, 'TRACK_NEGATIVE_Z', 'UP_Y'
cam_d.sensor_fit, cam_d.sensor_width = 'HORIZONTAL', 36
if MODE == 'portrait':
    scene.render.resolution_x, scene.render.resolution_y = 720, 1280
    cam_d.lens, R0, R1 = 44, 40.0, 36.5
    cam_d.shift_x, cam_d.shift_y = 0.0, -0.40
    AZ0, AZ1 = 46.0, -14.0
else:
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    cam_d.lens, R0, R1 = 46, 70.0, 62.0
    cam_d.shift_x, cam_d.shift_y = -0.22, -0.02
    AZ0, AZ1 = 46.0, -14.0
scene.render.resolution_percentage = 100
EL0, EL1 = 36.0, 29.0
N = int(DUR * 4) + 1
for k in range(N):
    t = k / 4
    u = smooth(t / DUR)
    az, el, R = radians(lerp(AZ0, AZ1, u)), radians(lerp(EL0, EL1, u)), lerp(R0, R1, u)
    tz = lerp(1.0, 3.4, smooth(min(1, max(0, (t - 2.5) / 5.0))))
    tp_ = (0, 2.0, tz)
    cam.location = (tp_[0] + R * sin(az) * cos(el), tp_[1] - R * cos(az) * cos(el), tp_[2] + R * sin(el))
    cam.keyframe_insert('location', frame=F(t))
    tgt.location = tp_
    tgt.keyframe_insert('location', frame=F(t))

sun_d = bpy.data.lights.new('sun', 'SUN')
sun_d.energy, sun_d.angle = 4.2, radians(4)
sun = link(bpy.data.objects.new('sun', sun_d))
sun.rotation_euler = (radians(52), radians(8), radians(38))
sun_d.color = (1.0, 0.97, 0.92)
sun_d.keyframe_insert('color', frame=1)
sun_d.color = (1.0, 0.86, 0.66)
sun_d.keyframe_insert('color', frame=NF)
sun.rotation_euler = (radians(52), radians(8), radians(38))
sun.keyframe_insert('rotation_euler', frame=1)
sun.rotation_euler = (radians(38), radians(8), radians(30))
sun.keyframe_insert('rotation_euler', frame=NF)

world = bpy.data.worlds.new('w')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = hexc('#efe7d7')
bg.inputs['Strength'].default_value = 1.75

# ---------------------------------------------------------------- render settings
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        scene.render.engine = eng
        break
    except TypeError:
        pass
for attr, val in (('taa_render_samples', 48), ('use_raytracing', True)):
    try:
        setattr(scene.eevee, attr, val)
    except Exception:
        pass
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
scene.view_settings.exposure = 0.0
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'

if STILL is not None:
    scene.frame_set(STILL)
    scene.render.filepath = f'{OUT}/still_{MODE}_{STILL:03d}.png'
    bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = f'{OUT}/f_'
    if RANGE:
        scene.frame_start, scene.frame_end = RANGE
    bpy.ops.render.render(animation=True)
