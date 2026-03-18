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

## Key configuration

`app.json` includes:

- `extra.cloudApiBase`
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
