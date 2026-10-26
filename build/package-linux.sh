#!/bin/bash
#
# Purpose: assemble the two shipping KDX Linux artifacts from a prepared app
#          tree, a NWJS runtime and the bundled node/miner binaries:
#            - kdx_<version>_amd64.deb  system install, app read-only at /opt/kdx
#            - KDX-x86_64.AppImage      portable, no-root, runs from its mount
#          Both carry the freedesktop integration that binds the running window
#          to its dock icon, and both force the X11 Ozone backend.
#
# Usage:   build/package-linux.sh --app-src <dir> --runtime <dir> --out <dir>
#                                 [--version <v>] [--workdir <dir>]
#                                 [--appimagetool <path>] [--deb-only]
#                                 [--appimage-only]
#
#          --app-src       prepared KDX app tree (sources plus node_modules,
#                          vendor/ and bin/<platform>-<arch>/ binaries)
#          --runtime       NWJS runtime directory (the one holding the nw
#                          executable)
#          --out           directory to write the artifacts into
#          --version       package version; defaults to the app package.json
#          --workdir       staging root; defaults to <out>/.stage
#          --appimagetool  appimagetool AppImage; defaults to $APPIMAGETOOL
#          --appimage-runtime
#                          type-2 runtime to embed. Without it appimagetool
#                          fetches one over the network at build time, which
#                          both requires connectivity and lets the embedded
#                          runtime drift between builds; pin it to keep the
#                          build offline and repeatable.
#
# Dependencies: bash, coreutils, findutils, rsync, dpkg-deb, appimagetool.
#               No compiler: the node binaries and the NWJS runtime are
#               inputs, built elsewhere. No network either, once the AppImage
#               runtime is pinned with --appimage-runtime.

set -euo pipefail

readonly INSTALL_PREFIX="/opt/kdx"
readonly SHARE_PREFIX="/usr/share"
readonly PACKAGE_NAME="kdx"
readonly PACKAGE_ARCH="amd64"
readonly APPIMAGE_ARCH="x86_64"
readonly WM_CLASS="kdx"
readonly ICON_SIZES="48x48 128x128 256x256 512x512"
# WM_CLASS only exists under the X11 backend, and the dock entry binds to it,
# so every launch entry point must set both and declare the matching class.
readonly REQUIRED_LAUNCH_FLAGS=("--ozone-platform=x11" "--class=$WM_CLASS")
readonly REQUIRED_DESKTOP_KEY="StartupWMClass=$WM_CLASS"
readonly DIR_MODE=755
readonly EXEC_MODE=755
readonly DATA_MODE=644
readonly BUILD_NICE=10
readonly BUILD_IONICE_CLASS=3

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SCRIPT_DIR
readonly ASSET_DIR="$SCRIPT_DIR/linux"

# Dev-state that a working tree may carry and a shipped payload must not.
# The runtime state is anchored to the tree root: dependencies legitimately
# ship files of the same name, and an unanchored pattern silently drops them.
readonly PAYLOAD_EXCLUDES=(".git" "/logs" "/config.json")

app_src=""
runtime_dir=""
out_dir=""
version=""
work_dir=""
appimagetool="${APPIMAGETOOL:-}"
appimage_runtime=""
build_deb=1
build_appimage=1

# Diagnostics go to stderr so stdout carries only the values callers capture.
log() {
    printf '[package-linux] %s\n' "$*" >&2
}

die() {
    printf '[package-linux] ERROR: %s\n' "$*" >&2
    exit 1
}

# Print the header block, delimited by its own text rather than by line
# numbers, so editing the header cannot silently truncate --help.
usage() {
    awk '/^# Purpose:/ { inside = 1 }
         inside && !/^#/ { exit }
         inside { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"
}

parse_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --app-src) app_src="${2:-}"; shift 2 ;;
            --runtime) runtime_dir="${2:-}"; shift 2 ;;
            --out) out_dir="${2:-}"; shift 2 ;;
            --version) version="${2:-}"; shift 2 ;;
            --workdir) work_dir="${2:-}"; shift 2 ;;
            --appimagetool) appimagetool="${2:-}"; shift 2 ;;
            --appimage-runtime) appimage_runtime="${2:-}"; shift 2 ;;
            --deb-only) build_appimage=0; shift ;;
            --appimage-only) build_deb=0; shift ;;
            -h|--help) usage; exit 0 ;;
            *) die "unknown argument: $1 (try --help)" ;;
        esac
    done
}

require_dir() {
    local path="$1" what="$2"
    [ -n "$path" ] || die "$what is required (try --help)"
    [ -d "$path" ] || die "$what is not a directory: $path"
}

read_app_version() {
    local manifest="$app_src/package.json"
    [ -f "$manifest" ] || die "app tree has no package.json: $manifest"
    local found
    found="$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$manifest" | head -1)"
    [ -n "$found" ] || die "no version field in $manifest"
    printf '%s' "$found"
}

assert_launch_flags() {
    local entry_point="$1" flag
    for flag in "${REQUIRED_LAUNCH_FLAGS[@]}"; do
        grep -qF -- "$flag" "$entry_point" \
            || die "launch entry point $entry_point does not pass $flag"
    done
}

assert_desktop_class() {
    local desktop="$1"
    grep -qxF -- "$REQUIRED_DESKTOP_KEY" "$desktop" \
        || die "desktop entry $desktop does not declare $REQUIRED_DESKTOP_KEY"
}

preflight() {
    # Both restrictions together select nothing, which would otherwise reach
    # the closing summary with an empty artifact list and report success.
    if [ "$build_deb" -eq 0 ] && [ "$build_appimage" -eq 0 ]; then
        die "--deb-only and --appimage-only are mutually exclusive"
    fi

    require_dir "$app_src" "--app-src"
    require_dir "$runtime_dir" "--runtime"
    [ -n "$out_dir" ] || die "--out is required (try --help)"
    [ -x "$runtime_dir/nw" ] || die "no executable nw in the runtime: $runtime_dir/nw"
    require_dir "$ASSET_DIR" "packaging asset directory"

    local asset
    for asset in AppRun kdx appimage/kdx.desktop deb/kdx.desktop \
                 deb/DEBIAN/control.in deb/DEBIAN/postinst deb/DEBIAN/postrm; do
        [ -f "$ASSET_DIR/$asset" ] || die "missing packaging asset: $ASSET_DIR/$asset"
    done

    local size
    for size in $ICON_SIZES; do
        [ -f "$ASSET_DIR/icons/hicolor/$size/apps/$PACKAGE_NAME.png" ] \
            || die "missing icon: $ASSET_DIR/icons/hicolor/$size/apps/$PACKAGE_NAME.png"
    done

    assert_launch_flags "$ASSET_DIR/AppRun"
    assert_launch_flags "$ASSET_DIR/kdx"
    assert_desktop_class "$ASSET_DIR/appimage/kdx.desktop"
    assert_desktop_class "$ASSET_DIR/deb/kdx.desktop"
    [ -f "$app_src/resources/images/$PACKAGE_NAME.svg" ] \
        || die "missing scalable icon in the app tree: $app_src/resources/images/$PACKAGE_NAME.svg"

    command -v rsync >/dev/null || die "rsync is required"
    if [ "$build_deb" -eq 1 ]; then
        command -v dpkg-deb >/dev/null || die "dpkg-deb is required for the .deb"
    fi
    if [ "$build_appimage" -eq 1 ]; then
        [ -n "$appimagetool" ] || die "--appimagetool (or APPIMAGETOOL) is required for the AppImage"
        [ -x "$appimagetool" ] || die "appimagetool is not executable: $appimagetool"
        if [ -n "$appimage_runtime" ] && [ ! -f "$appimage_runtime" ]; then
            die "no such AppImage runtime file: $appimage_runtime"
        fi
    fi

    [ -n "$version" ] || version="$(read_app_version)"
    [ -n "$work_dir" ] || work_dir="$out_dir/.stage"
}

# Copy the app tree and the NWJS runtime into <root>/opt/kdx, and install the
# launcher that binds the window to its desktop entry.
stage_payload() {
    local root="$1"
    local prefix="$root$INSTALL_PREFIX"
    local -a excludes=()
    local entry

    for entry in "${PAYLOAD_EXCLUDES[@]}"; do
        excludes+=(--exclude "$entry")
    done

    install -d -m "$DIR_MODE" "$prefix"
    rsync -a --delete "${excludes[@]}" "$app_src/" "$prefix/app/"
    rsync -a --delete "$runtime_dir/" "$prefix/runtime/"
    install -m "$EXEC_MODE" "$ASSET_DIR/kdx" "$prefix/$PACKAGE_NAME"
}

# Install the freedesktop entry plus the icon set under <root><share_root>.
stage_desktop_integration() {
    local root="$1" desktop_src="$2"
    local share="$root$SHARE_PREFIX"
    local size

    install -D -m "$DATA_MODE" "$desktop_src" "$share/applications/$PACKAGE_NAME.desktop"
    for size in $ICON_SIZES; do
        install -D -m "$DATA_MODE" "$ASSET_DIR/icons/hicolor/$size/apps/$PACKAGE_NAME.png" \
            "$share/icons/hicolor/$size/apps/$PACKAGE_NAME.png"
    done
    install -D -m "$DATA_MODE" "$app_src/resources/images/$PACKAGE_NAME.svg" \
        "$share/icons/hicolor/scalable/apps/$PACKAGE_NAME.svg"
}

# A directory that is not world-traversable makes the installed app
# unreachable at launch, which no static inspection of the archive reveals.
enforce_dir_mode() {
    local root="$1"
    find "$root" -type d -exec chmod "$DIR_MODE" {} +
}

# The payload is copied with the modes of the tree it came from, which a
# group-writable checkout passes on to the installed files. Keep only whether
# each file is executable.
enforce_file_mode() {
    local root="$1"
    find "$root" -type f -perm /111 -exec chmod "$EXEC_MODE" {} +
    find "$root" -type f ! -perm /111 -exec chmod "$DATA_MODE" {} +
}

installed_size_kb() {
    local root="$1"
    du -sk --exclude=DEBIAN "$root" | cut -f1
}

stage_deb() {
    local root="$1"

    rm -rf "$root"
    stage_payload "$root"
    stage_desktop_integration "$root" "$ASSET_DIR/deb/kdx.desktop"

    # A copy here would resolve its own location to /usr/bin and exec a
    # runtime path that does not exist; the launcher must stay a symlink.
    install -d -m "$DIR_MODE" "$root/usr/bin"
    ln -sfn "$INSTALL_PREFIX/$PACKAGE_NAME" "$root/usr/bin/$PACKAGE_NAME"

    install -d -m "$DIR_MODE" "$root/DEBIAN"
    sed -e "s/@VERSION@/$version/" \
        -e "s/@INSTALLED_SIZE@/$(installed_size_kb "$root")/" \
        "$ASSET_DIR/deb/DEBIAN/control.in" > "$root/DEBIAN/control"
    chmod "$DATA_MODE" "$root/DEBIAN/control"
    install -m "$EXEC_MODE" "$ASSET_DIR/deb/DEBIAN/postinst" "$root/DEBIAN/postinst"
    install -m "$EXEC_MODE" "$ASSET_DIR/deb/DEBIAN/postrm" "$root/DEBIAN/postrm"

    enforce_dir_mode "$root$INSTALL_PREFIX"
    enforce_file_mode "$root$INSTALL_PREFIX"
}

stage_appdir() {
    local root="$1"

    rm -rf "$root"
    stage_payload "$root"
    stage_desktop_integration "$root" "$ASSET_DIR/appimage/kdx.desktop"

    # appimagetool reads the entry point, the top-level desktop entry and the
    # icon it points at from the AppDir root.
    install -m "$EXEC_MODE" "$ASSET_DIR/AppRun" "$root/AppRun"
    install -m "$DATA_MODE" "$ASSET_DIR/appimage/kdx.desktop" "$root/$PACKAGE_NAME.desktop"
    install -m "$DATA_MODE" "$ASSET_DIR/icons/hicolor/512x512/apps/$PACKAGE_NAME.png" \
        "$root/$PACKAGE_NAME.png"
    ln -sfn "$PACKAGE_NAME.png" "$root/.DirIcon"

    enforce_dir_mode "$root$INSTALL_PREFIX"
    enforce_file_mode "$root$INSTALL_PREFIX"
}

build_deb_artifact() {
    local root="$1"
    local artifact="$out_dir/${PACKAGE_NAME}_${version}_${PACKAGE_ARCH}.deb"

    log "building $artifact"
    nice -n "$BUILD_NICE" ionice -c"$BUILD_IONICE_CLASS" \
        dpkg-deb --build --root-owner-group -Zgzip "$root" "$artifact" >&2
    printf '%s' "$artifact"
}

build_appimage_artifact() {
    local root="$1"
    local artifact="$out_dir/KDX-$APPIMAGE_ARCH.AppImage"
    local -a runtime_opt=()

    if [ -n "$appimage_runtime" ]; then
        runtime_opt=(--runtime-file "$appimage_runtime")
    else
        log "no --appimage-runtime given; appimagetool will fetch one over the network"
    fi

    log "building $artifact"
    ARCH="$APPIMAGE_ARCH" APPIMAGE_EXTRACT_AND_RUN=1 \
        nice -n "$BUILD_NICE" ionice -c"$BUILD_IONICE_CLASS" \
        "$appimagetool" --no-appstream "${runtime_opt[@]}" "$root" "$artifact" >&2
    chmod "$EXEC_MODE" "$artifact"
    printf '%s' "$artifact"
}

main() {
    parse_args "$@"
    preflight

    install -d -m "$DIR_MODE" "$out_dir" "$work_dir"
    log "version $version"
    log "app tree $app_src"
    log "runtime  $runtime_dir"

    local -a artifacts=()
    if [ "$build_deb" -eq 1 ]; then
        stage_deb "$work_dir/deb"
        artifacts+=("$(build_deb_artifact "$work_dir/deb")")
    fi
    if [ "$build_appimage" -eq 1 ]; then
        stage_appdir "$work_dir/appdir"
        artifacts+=("$(build_appimage_artifact "$work_dir/appdir")")
    fi

    # Summarising an empty list would hash stdin and report that as an
    # artifact line, turning a build that produced nothing into a success.
    [ ${#artifacts[@]} -gt 0 ] || die "no artifact was produced"

    log "artifacts:"
    sha256sum "${artifacts[@]}"
}

main "$@"
