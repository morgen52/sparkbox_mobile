export type NearbyDeviceUiInput = {
  id: string;
  probe?: boolean;
};

export type NearbyDeviceButtonState = {
  disabled: boolean;
  label: string;
  status: string;
};

export function getNearbyDeviceButtonState(
  device: NearbyDeviceUiInput,
  connectingDeviceId: string | null,
): NearbyDeviceButtonState {
  if (!connectingDeviceId) {
    return {
      disabled: false,
      label: device.probe ? 'Probe' : 'Connect',
      status: '',
    };
  }

  if (connectingDeviceId !== device.id) {
    return {
      disabled: true,
      label: 'Wait',
      status: '',
    };
  }

  if (device.probe) {
    return {
      disabled: true,
      label: 'Probing…',
      status: 'Checking whether this nearby Bluetooth device is your Sparkbox…',
    };
  }

  return {
    disabled: true,
    label: 'Connecting…',
    status: 'Opening Sparkbox over Bluetooth…',
  };
}
