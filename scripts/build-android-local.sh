#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/homebrew/share/android-commandlinetools}"
ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
BUILD_VARIANT="${1:-release}"
export ANDROID_SDK_ROOT ANDROID_HOME JAVA_HOME PATH

proxy_url="${https_proxy:-${HTTPS_PROXY:-${http_proxy:-${HTTP_PROXY:-}}}}"
if [[ -n "$proxy_url" ]]; then
  proxy_url="${proxy_url#*://}"
  proxy_host="${proxy_url%%:*}"
  proxy_port="${proxy_url##*:}"
  if [[ -n "$proxy_host" && -n "$proxy_port" ]]; then
    JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Dhttp.proxyHost=${proxy_host} -Dhttp.proxyPort=${proxy_port} -Dhttps.proxyHost=${proxy_host} -Dhttps.proxyPort=${proxy_port}"
    export JAVA_TOOL_OPTIONS
  fi
fi

if ! command -v sdkmanager >/dev/null 2>&1; then
  echo "sdkmanager not found. Install android-commandlinetools first." >&2
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install android-platform-tools first." >&2
  exit 1
fi

if [[ ! -d "$JAVA_HOME" ]]; then
  echo "JAVA_HOME does not exist: $JAVA_HOME" >&2
  exit 1
fi

set +o pipefail
yes | sdkmanager --licenses >/dev/null
set -o pipefail
sdkmanager \
  "platform-tools" \
  "platforms;android-36" \
  "build-tools;36.0.0" \
  "ndk;27.1.12297006" \
  "cmake;3.22.1" >/dev/null

cd "$ROOT_DIR"

if [[ ! -d android ]]; then
  npx expo prebuild --platform android
fi

cd android

case "$BUILD_VARIANT" in
  release)
    GRADLE_TASK="assembleRelease"
    APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
    ;;
  debug)
    GRADLE_TASK="assembleDebug"
    APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
    ;;
  *)
    echo "Unsupported build variant: $BUILD_VARIANT (expected: release or debug)" >&2
    exit 1
    ;;
esac

./gradlew --no-daemon --console=plain "$GRADLE_TASK"

echo
echo "APK built at:"
echo "$APK_PATH"
