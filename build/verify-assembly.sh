#!/bin/bash
#
# Purpose: check a prepared KDX app tree against the integration manifest.
#          The shipping artifact is assembled from several branches, so the
#          file-by-file resolution is a real input to the build; this checks
#          the tree actually carries it instead of trusting that it does.
#
# Usage:   build/verify-assembly.sh <app-tree> [<manifest>]
#
#          <app-tree>  the tree that would be passed to package-linux.sh
#          <manifest>  defaults to build/linux/integration-manifest
#
# Exits non-zero on the first mismatch, naming every file that disagrees.
#
# Dependencies: bash, coreutils.

set -euo pipefail

readonly SHA_PREFIX_LENGTH=12

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SCRIPT_DIR

app_tree="${1:-}"
manifest="${2:-$SCRIPT_DIR/linux/integration-manifest}"

if [ -z "$app_tree" ]; then
    printf 'usage: %s <app-tree> [<manifest>]\n' "${BASH_SOURCE[0]}" >&2
    exit 2
fi
[ -d "$app_tree" ] || { printf 'no such app tree: %s\n' "$app_tree" >&2; exit 2; }
[ -f "$manifest" ] || { printf 'no such manifest: %s\n' "$manifest" >&2; exit 2; }

checked=0
missing=0
mismatched=0

# Manifest body lines are "<sha prefix>  <path>". The path is taken as the
# verbatim remainder of the line, never as a whitespace-separated field: a
# payload path may contain spaces, and splitting one would look up a truncated
# name and report a correct tree as MISSING.
while IFS= read -r line; do
    trimmed="${line#"${line%%[![:space:]]*}"}"
    case "$trimmed" in
        ''|'#'*|'['*) continue ;;
    esac

    want="${trimmed:0:SHA_PREFIX_LENGTH}"
    rest="${trimmed:SHA_PREFIX_LENGTH}"

    # A body row is a full-length lowercase-hex prefix followed by the
    # separator; anything else is a heading and is skipped.
    case "$want" in
        *[!0-9a-f]*) continue ;;
    esac
    [ ${#want} -eq "$SHA_PREFIX_LENGTH" ] || continue
    case "$rest" in
        '  '*) path="${rest#  }" ;;
        *) continue ;;
    esac
    [ -n "$path" ] || continue

    if [ ! -f "$app_tree/$path" ]; then
        printf 'MISSING     %s\n' "$path"
        missing=$((missing + 1))
        continue
    fi

    got="$(sha256sum "$app_tree/$path" | cut -c1-"$SHA_PREFIX_LENGTH")"
    checked=$((checked + 1))
    if [ "$got" != "$want" ]; then
        printf 'MISMATCH    %s (want %s, got %s)\n' "$path" "$want" "$got"
        mismatched=$((mismatched + 1))
    fi
done < "$manifest"

printf 'checked %d file(s): %d mismatched, %d missing\n' \
    "$checked" "$mismatched" "$missing"

[ "$mismatched" -eq 0 ] && [ "$missing" -eq 0 ]
