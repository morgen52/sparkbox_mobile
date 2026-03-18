# Sparkbox Mobile

Native mobile onboarding client for Sparkbox.

## Scope

- sign in to the Sparkbox cloud
- scan the Sparkbox QR label
- reserve the device with `POST /api/pairing/start`
- connect to the nearby Sparkbox over BLE
- send home Wi-Fi credentials plus the fresh pairing token
- wait for `bound_online` either over BLE status reads or cloud verification

This repo is the BLE-first replacement for the old hotspot-first onboarding path.

## Stack

- Expo
- React Native
- `react-native-ble-plx`
- `expo-camera`

## Local development

```bash
npm install
npm run typecheck
npx expo start
```

BLE requires a development build. `Expo Go` is not enough because `react-native-ble-plx` uses native modules.

## Fast debug mode

Use this as the default iteration loop after the first install:

```bash
npm run dev
```

Workflow:

- install a `development` build on the phone once
- keep using `expo start --dev-client` for most UI, copy, flow, and BLE scan logic changes
- rely on hot reload / manual reload instead of shipping a new APK for every tweak

Only create a new APK when one of these changes happens:

- new native dependency
- Bluetooth / camera permission changes
- `app.json` native configuration changes
- a stable milestone needs to be published through `familyapp`

Build profiles live in `eas.json`:

- `development`: internal development client
- `preview`: internal test build
- `production`: store-ready release profile

## OTA preview updates

This repo now uses Expo OTA updates for the `preview` lane:

- preview and development builds are pinned to the `preview` channel
- production builds are pinned to the `production` channel
- `runtimeVersion.policy=appVersion` keeps JS-only updates compatible with the installed native shell

Typical workflow:

```bash
npm run build:preview
npm run update:preview -- --message "Describe the JS-only fix"
```

Use `build:preview` when the native shell changes, for example after:

- adding a native dependency such as `expo-updates`
- changing Bluetooth, camera, or location permissions
- changing `app.json` native config

Use `update:preview` for JS-only fixes such as:

- UI and copy changes
- BLE scan filtering logic
- onboarding flow and retry logic
- diagnostics screens

## Local Android builds

Use this when Expo cloud queues are too slow and you only need an installable Android test APK from this Mac:

```bash
npm run build:android:local
```

What it does:

- uses Homebrew `openjdk@17`
- uses Android command-line tools under `/opt/homebrew/share/android-commandlinetools`
- ensures the required Android 36 SDK pieces are installed
- forwards `http_proxy` / `https_proxy` into Java proxy flags when this Mac is behind a local proxy
- runs `expo prebuild --platform android` if the local `android/` folder does not exist
- builds `android/app/build/outputs/apk/debug/app-debug.apk`

Current local prerequisites on this Mac:

- `brew install openjdk@17`
- `brew install --cask android-commandlinetools android-platform-tools`

The generated `android/` folder is already ignored by git in this repo.

## Key configuration

`app.json` includes:

- `extra.cloudApiBase`
- `runtimeVersion` and `updates.url` for Expo OTA delivery
- Bluetooth permissions for iOS and Android
- camera permission text for QR scanning

## BLE contract

Service UUID:

- `7f92f5d8-5d55-4f0d-93fa-1ac4b7811c10`

Characteristics:

- info: `7f92f5d8-5d55-4f0d-93fa-1ac4b7811c11`
- status: `7f92f5d8-5d55-4f0d-93fa-1ac4b7811c12`
- networks: `7f92f5d8-5d55-4f0d-93fa-1ac4b7811c13`
- command: `7f92f5d8-5d55-4f0d-93fa-1ac4b7811c14`

Payloads are compact UTF-8 JSON encoded as base64 for the BLE library write/read API.
