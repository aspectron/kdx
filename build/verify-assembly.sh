#!/bin/bash
#
# Purpose: check a prepared KDX app tree against the commit it was exported
#          from. Every file the commit tracks must be in the tree with the
#          committed content, except the packaging recipe, which
#          package-linux.sh leaves out of the payload. Files the commit does
#          not track (node_modules/, bin/, local state) are not checked.
#
# Usage:   build/verify-assembly.sh <app-tree> [<commit>]
#
#          <app-tree>  the tree that would be passed to package-linux.sh, or
#                      the app directory of a built package
#          <commit>    defaults to HEAD of the repository holding this script
#
# Exits 1 when any file is missing or differs, naming each one, and 2 when
# the check cannot run.
#
# Dependencies: bash, coreutils, git.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SCRIPT_DIR

# The packaging recipe, as package-linux.sh leaves it out of the payload. A
# trailing slash names a directory and everything below it.
readonly RECIPE_PATHS=("build/linux/" "build/package-linux.sh" "build/verify-assembly.sh")
readonly GIT_SYMLINK_MODE="120000"

cannot_check() {
    printf '%s\n' "$*" >&2
    exit 2
}

is_recipe_path() {
    local path="$1" entry
    for entry in "${RECIPE_PATHS[@]}"; do
        case "$entry" in
            */) [[ "$path" == "$entry"* ]] && return 0 ;;
            *) [[ "$path" == "$entry" ]] && return 0 ;;
        esac
    done
    return 1
}

app_tree="${1:-}"
commit="${2:-HEAD}"

[ -n "$app_tree" ] || cannot_check "usage: ${BASH_SOURCE[0]} <app-tree> [<commit>]"
[ -d "$app_tree" ] || cannot_check "no such app tree: $app_tree"
app_tree="$(cd -- "$app_tree" && pwd -P)"
repo="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)" \
    || cannot_check "not inside a git checkout: $SCRIPT_DIR"
git -C "$repo" rev-parse --verify --quiet "$commit^{commit}" >/dev/null \
    || cannot_check "no such commit: $commit"

# The listing goes to a file first, so a failing git command stops the check
# instead of feeding it a short list that would then pass.
listing="$(mktemp)"
trap 'rm -f -- "$listing"' EXIT
git -C "$repo" ls-tree -r -z --full-tree "$commit" > "$listing"

checked=0
missing=0
mismatched=0
skipped=0

# Records are "<mode> <type> <object><TAB><path>", NUL-terminated, so a path
# may hold spaces and is never split.
while IFS= read -r -d '' record; do
    path="${record#*$'\t'}"
    read -r mode type want <<< "${record%%$'\t'*}"
    [ "$type" = "blob" ] || cannot_check "cannot check a $type entry: $path"

    if is_recipe_path "$path"; then
        skipped=$((skipped + 1))
        continue
    fi

    file="$app_tree/$path"
    got=""
    if [ "$mode" = "$GIT_SYMLINK_MODE" ]; then
        if [ -L "$file" ]; then
            got="$(printf '%s' "$(readlink -- "$file")" | git -C "$repo" hash-object --stdin)"
        fi
    elif [ -f "$file" ] && [ ! -L "$file" ]; then
        got="$(git -C "$repo" hash-object --no-filters -- "$file")"
    fi

    if [ -z "$got" ]; then
        printf 'MISSING     %s\n' "$path"
        missing=$((missing + 1))
        continue
    fi

    checked=$((checked + 1))
    if [ "$got" != "$want" ]; then
        printf 'MISMATCH    %s (want %s, got %s)\n' "$path" "$want" "$got"
        mismatched=$((mismatched + 1))
    fi
done < "$listing"

printf 'checked %d file(s) of %s: %d mismatched, %d missing; %d packaging recipe file(s) not checked\n' \
    "$checked" "$(git -C "$repo" rev-parse --short "$commit")" "$mismatched" "$missing" "$skipped"

# A check that compared nothing has proven nothing.
[ "$checked" -gt 0 ] || { printf 'no file was checked\n' >&2; exit 1; }
[ "$mismatched" -eq 0 ] && [ "$missing" -eq 0 ]
