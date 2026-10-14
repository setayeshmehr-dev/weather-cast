#!/usr/bin/env bash
# Reads the original videos from video-source/ and writes the optimized ones to public/videos/:
#   public/videos/<name>.webm              page background (960px wide)
#   public/videos/card/<name>.webm         sidebar card (480px wide)
#   public/videos/poster/<name>.webp       page poster
#   public/videos/poster/card/<name>.webp  card poster
# Needs ffmpeg with libvpx-vp9 and libwebp. Run from the project root:
#   bash scripts/optimize-videos.sh
set -euo pipefail

SOURCE_DIR="video-source"
OUT_DIR="public/videos"

mkdir -p "$OUT_DIR/card" "$OUT_DIR/poster/card"

shopt -s nullglob

for input in "$SOURCE_DIR"/*.webm "$SOURCE_DIR"/*.mp4; do
    name="$(basename "${input%.*}")"
    echo "-> $name"

    # Page background: no audio, 24 fps. The length is not cut so the loop stays seamless.
    ffmpeg -y -loglevel error -i "$input" -an -vf "scale=960:-2,fps=24" \
        -c:v libvpx-vp9 -b:v 0 -crf 38 -pix_fmt yuv420p \
        -row-mt 1 -deadline good -cpu-used 2 \
        "$OUT_DIR/$name.webm"

    # Sidebar card: smaller and lighter.
    ffmpeg -y -loglevel error -i "$input" -an -vf "scale=480:-2,fps=20" \
        -c:v libvpx-vp9 -b:v 0 -crf 42 -pix_fmt yuv420p \
        -row-mt 1 -deadline good -cpu-used 2 \
        "$OUT_DIR/card/$name.webm"

    # Posters (a frame at 1s, since many clips start with a fade-in).
    ffmpeg -y -loglevel error -ss 1 -i "$input" -frames:v 1 \
        -vf "scale=960:-2" -c:v libwebp -quality 70 \
        "$OUT_DIR/poster/$name.webp"

    ffmpeg -y -loglevel error -ss 1 -i "$input" -frames:v 1 \
        -vf "scale=480:-2" -c:v libwebp -quality 65 \
        "$OUT_DIR/poster/card/$name.webp"
done

echo "Done."
du -sh "$OUT_DIR"