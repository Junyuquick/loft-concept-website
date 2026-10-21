# Hero scene

`build_hero.py` builds the 8 second homepage hero in Blender (old timber house, demolition, dig, foundation, frame, facade, finished home) and renders it.

```
Blender -b -P scripts/hero-scene/build_hero.py -- portrait  <out_dir>   # 720x1280
Blender -b -P scripts/hero-scene/build_hero.py -- landscape <out_dir>   # 1280x720
Blender -b -P scripts/hero-scene/build_hero.py -- portrait  <out_dir> 190    # one still
```

Encode the PNG sequence at 24 fps:

```
ffmpeg -framerate 24 -i <out_dir>/f_%04d.png -an -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart public/videos/hero-portrait.mp4
ffmpeg -framerate 24 -i <out_dir>/f_%04d.png -an -c:v libvpx-vp9 -crf 26 -b:v 0 -pix_fmt yuv420p public/videos/hero-portrait.webm
```

Landscape files are `hero.mp4` / `hero.webm`; posters are the first frame (`hero-poster.jpg`, `hero-poster-portrait.jpg`).
Built with Blender 5.2.

## v2 (current): realistic build

`build_hero2.py` is the version that shipped. Same 8 second storyboard, but built from generated 3D models plus free CC0 assets instead of boxes:

- Meshy (image to 3D, from the client's before and after photos) made the old house and the finished house. Meshy text to 3D made the excavator, worker, palm, tree and sedan. `meshy_gen.py` and `meshy_text.py` do this; they read the API key from `~/.config/meshy/key` and never print it.
- Poly Haven (CC0) supplies the sky (`kloofendal_48d_partly_cloudy_puresky`), the ground and plaster textures, and the shrubs.
- The finished house is revealed upward with a height-clip in its materials (`add_clip`), so one model builds itself floor by floor.

The models (about 300 MB) and textures are not committed. Put them in `assets/models/*.glb`, `assets/models/ph/<shrub>/`, `assets/tex/<name>/{Diffuse,nor_gl,Rough}.jpg` and `assets/hdri/sky.hdr` next to the script, then run:

```
Blender -b -P build_hero2.py -- portrait  <out_dir>
Blender -b -P build_hero2.py -- landscape <out_dir>
Blender -b -P build_hero2.py -- portrait  <out_dir> 33-192   # resume a frame range
```

Encode with the commands above. `build_hero.py` is the earlier box-built version, kept for reference.

## v3 (current, shipped): Seedance time-lapse

The hero is now a generated time-lapse, not the Blender render. Workflow:

1. `fal_image.py` (Nano Banana Pro edit on fal) made four stage stills of the client's street render (old house, pit, frame, finished), then relit them to a low warm camera-left sun using the client's style frame as a light-only reference. Portrait (9:16) stills were recomposed from the landscape ones.
2. `fal_i2v.py` ran Seedance 2.0 image-to-video (standard tier, 720p) three times with a first and last frame each: old house to excavation (calm excavator dismantling, thin low dust only), excavation to frame, frame to finished home. Locked-off camera, constant light, silent.
3. ffmpeg joined the shots, sped them to 10 s, light grade (contrast 0.97, saturation 0.94), subtle grain, then encoded MP4 (crf 25, maxrate 3M) and WebM (VP9 crf 33).

Keys are read from `~/.config/fal/key` and never printed. `fal_seedance.py` is the earlier reference-to-video attempt (orbit camera), kept for reference; it looked more obviously AI. `build_hero.py` and `build_hero2.py` are the Blender versions (previs and fallback).
Total generation cost for both orientations was roughly USD 21 including the discarded drafts.
