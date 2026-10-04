#!/usr/bin/env bash
set -euo pipefail
mkdir -p public/videos src/assets/projects/mimosa
SRC=legacy/assets/videos/Hero.mov
CRF="${1:-28}"

ffmpeg -y -i "$SRC" -an -vf "scale='min(1920,iw)':-2,fps=30" -c:v libx264 -crf "$CRF" -preset slow -pix_fmt yuv420p -movflags +faststart public/videos/hero.mp4
ffmpeg -y -i "$SRC" -an -vf "scale='min(1920,iw)':-2,fps=30" -c:v libvpx-vp9 -crf $((CRF + 8)) -b:v 0 public/videos/hero.webm
ffmpeg -y -ss 1 -i "$SRC" -frames:v 1 -vf "scale='min(1920,iw)':-2" -q:v 3 public/videos/hero-poster.jpg

cp legacy/assets/images/mimosa/mimosa-tour.mp4 public/videos/mimosa-tour.mp4
ffmpeg -y -ss 2 -i legacy/assets/images/mimosa/mimosa-tour.mp4 -frames:v 1 -q:v 3 src/assets/projects/mimosa/poster.jpg

ls -la public/videos
