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
