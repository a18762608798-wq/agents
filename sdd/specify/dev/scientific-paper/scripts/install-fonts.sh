#!/usr/bin/env bash
# Install this preset's complete font dependency bundle without overwriting local changes.
set -euo pipefail

if (( $# > 1 )); then
    printf 'Usage: bash %s [project-root]\n' "$0" >&2
    exit 2
fi

PRESET_ROOT="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="${1:-$PWD}"
if [[ ! -d "$PROJECT_ROOT" ]]; then
    printf 'Project root does not exist: %s\n' "$PROJECT_ROOT" >&2
    exit 1
fi
PROJECT_ROOT="$(CDPATH='' cd -- "$PROJECT_ROOT" && pwd)"
SOURCE_DIR="$PRESET_ROOT/assets/fonts/noto-serif-cjk"
TARGET_DIR="$PROJECT_ROOT/assets/fonts/noto-serif-cjk"
FILES=(NotoSerifCJKsc-Regular.otf NotoSerifCJKsc-Bold.otf LICENSE)

# Preflight every file before creating directories or copying anything.
for name in "${FILES[@]}"; do
    if [[ ! -f "$SOURCE_DIR/$name" ]]; then
        printf 'Missing preset dependency: %s\n' "$SOURCE_DIR/$name" >&2
        exit 1
    fi
    if [[ -e "$TARGET_DIR/$name" || -L "$TARGET_DIR/$name" ]]; then
        if [[ ! -f "$TARGET_DIR/$name" ]] || ! cmp -s -- "$SOURCE_DIR/$name" "$TARGET_DIR/$name"; then
            printf 'Font dependency conflict (not overwritten): %s\n' "$TARGET_DIR/$name" >&2
            exit 1
        fi
    fi
done

mkdir -p -- "$TARGET_DIR"
copied=0
for name in "${FILES[@]}"; do
    if [[ ! -e "$TARGET_DIR/$name" ]]; then
        cp -- "$SOURCE_DIR/$name" "$TARGET_DIR/$name"
        copied=$((copied + 1))
    fi
done
printf 'Font dependencies ready: %s (%d copied, %d unchanged)\n' \
    "$TARGET_DIR" "$copied" "$((${#FILES[@]} - copied))"
