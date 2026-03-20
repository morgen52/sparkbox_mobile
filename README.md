# Sparkbox Mobile

Unified native client for Sparkbox.

## Product scope

This app now owns the full user journey in one place:

- sign in, create a household, or join with an invite code
- first-time QR claim and hotspot onboarding
- later Wi-Fi reprovisioning from Settings without re-claiming the device
- everyday use inside the same shell: `Home / Chat / Files / Tasks / Settings`
- owner and member role management, including multi-owner households

The retired BLE-only onboarding flow is no longer the primary product path. Setup is hotspot-first through `Sparkbox-Setup`, with the same native app handling onboarding and daily use.

## Stack

- Expo
- React Native
- `expo-camera`
- `expo-document-picker`
- `expo-file-system`
- `expo-sharing`

## Local development

```bash
npm install
npm run typecheck
npm run dev
```

Use a development build on the phone for normal iteration. Most UI and JS-only onboarding changes can be tested with reloads instead of rebuilding an APK every time.

## Main app surfaces

- `Home`
  Household summary, device state, members, recent activity
- `Chat`
  Family and private chat sessions with per-session settings
- `Files`
  Family and private file workspaces with upload, download, rename, and delete
- `Tasks`
  Family and private tasks plus run history
- `Settings`
  Reprovisioning, diagnostics, reset, provider defaults, onboarding, invites, and member management

## Onboarding model

First-time onboarding:

1. create/sign in to the cloud account
2. scan the Sparkbox QR code
3. claim the device
4. join `Sparkbox-Setup`
5. choose home Wi-Fi in the native app
6. wait for `bound_online`

Reprovisioning:

- already claimed devices do not get scanned again
- owners start this from `Settings -> Devices and Network -> Change Wi-Fi`
- offline Jetson devices can fall back to `Sparkbox-Setup` automatically on startup if saved Wi-Fi does not recover

## Household roles

- the first person who claims and sets up Sparkbox becomes an `owner`
- households can have multiple `owner`s
- `owner`s can invite `owner`s or `member`s
- `owner`s can promote, demote, or remove other members
- the last remaining `owner` cannot be removed or demoted

## OTA updates

This repo uses Expo OTA updates:

- `development` and `preview` builds use the `preview` channel
- production builds use the `production` channel
- `runtimeVersion.policy=appVersion` keeps OTA compatibility tied to the installed native shell

Typical workflow:

```bash
npm run build:preview
npm run update:preview -- --message "Describe the JS-only fix"
```

## Local Android builds

Build locally when you want a side-loadable APK from this Mac:

```bash
npm run build:android:local
```

The helper script:

- uses Homebrew `openjdk@21`
- uses Android command-line tools under `/opt/homebrew/share/android-commandlinetools`
- ensures Android 36 SDK components exist
- forwards `http_proxy` / `https_proxy` into Java proxy flags when needed
- builds `android/app/build/outputs/apk/release/app-release.apk` by default

Debug build:

```bash
npm run build:android:local:debug
```

## Android release signing

Release builds support a dedicated keystore. Export these environment variables before building a production-signed APK:

- `SPARKBOX_UPLOAD_STORE_FILE`
- `SPARKBOX_UPLOAD_STORE_PASSWORD`
- `SPARKBOX_UPLOAD_KEY_ALIAS`
- `SPARKBOX_UPLOAD_KEY_PASSWORD`

For this Mac, `./scripts/build-android-local.sh` also auto-loads `./.env.signing.local` when present.

Release builds now fail closed by default if signing variables are missing. If you intentionally want a locally side-loaded release signed with the debug keystore, set `SPARKBOX_ALLOW_DEBUG_RELEASE_SIGNING=true`.

## Key configuration

`app.json` includes:

- `extra.cloudApiBase`
- Expo OTA runtime/update configuration
- camera permission text for QR scanning
- Android package and deep link scheme

## Verification

Common local checks:

```bash
npm run typecheck
npx vitest run src/authFlow.test.ts src/householdApi.test.ts src/tasksApi.test.ts src/appShell.test.ts src/releaseConfig.test.ts
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./scripts/build-android-local.sh release
```
