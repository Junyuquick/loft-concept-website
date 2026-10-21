#!/bin/bash
# Look definitions: build one filter_complex per look. Usage: source looks.sh; look_filter A|B|C
HAL='curves=all=0/0 0.66/0 0.88/0.45 1/1,gblur=sigma=16,colorchannelmixer=rr=1:gg=0.30:bb=0.07'
# Luma-preserving saturation as a matrix, so the chain stays in RGB (eq would convert the pixel format and break the halation blend).
sat() { awk -v s="$1" 'BEGIN{lr=0.2126;lg=0.7152;lb=0.0722;k=1-s; printf "colorchannelmixer=rr=%.4f:rg=%.4f:rb=%.4f:gr=%.4f:gg=%.4f:gb=%.4f:br=%.4f:bg=%.4f:bb=%.4f", lr*k+s,lg*k,lb*k, lr*k,lg*k+s,lb*k, lr*k,lg*k,lb*k+s}'; }
look_filter() {
  case "$1" in
  A) # Warm low-key dusk
    TONE="curves=all=0/0.025 0.18/0.115 0.45/0.33 0.72/0.60 0.92/0.84 1/0.92,colorbalance=rs=-0.02:bs=0.04:rm=0.03:bm=-0.03:rh=0.06:gh=0.02:bh=-0.06,$(sat 0.92)"
    HALO=0.45; VIG="PI/6"; GRAIN=6 ;;
  B) # Cool blue-hour, warm windows
    TONE="curves=all=0/0.03 0.18/0.10 0.45/0.30 0.72/0.56 0.92/0.80 1/0.90,colorbalance=rs=-0.05:bs=0.09:rm=-0.03:bm=0.06:rh=0.05:gh=0.015:bh=-0.05,$(sat 0.88)"
    HALO=0.50; VIG="PI/5.5"; GRAIN=6 ;;
  C) # Neutral film, milky blacks, restrained colour
    TONE="curves=all=0/0.045 0.25/0.17 0.5/0.40 0.78/0.70 1/0.93,colorbalance=rm=0.015:bm=-0.015:rh=0.03:bh=-0.03,$(sat 0.80)"
    HALO=0.55; VIG="PI/6"; GRAIN=8 ;;
  esac
  echo "[0:v]format=gbrp16le,${TONE},split=2[a][b];[b]${HAL}[h];[a][h]blend=all_mode=screen:all_opacity=${HALO},format=yuv420p,vignette=${VIG},noise=alls=${GRAIN}:allf=t+u[v]"
}
