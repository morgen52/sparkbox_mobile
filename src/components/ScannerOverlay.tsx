import React from 'react';
import { CameraView } from 'expo-camera';
import { Pressable, Text, View } from 'react-native';

type ScannerOverlayProps = {
  styles: Record<string, any>;
  visible: boolean;
  onScan: (value: string) => void;
  onClose: () => void;
};

export function ScannerOverlay({
  styles,
  visible,
  onScan,
  onClose,
}: ScannerOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.scannerOverlay}>
      <CameraView
        style={styles.scanner}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(event) => {
          onScan(event.data);
        }}
      />
      <View style={styles.scannerChrome}>
        <Text style={styles.scannerTitle}>Scan the Sparkbox QR label</Text>
        <Text style={styles.scannerCopy}>
          Point your phone at the printed code on the device or the shipping card.
        </Text>
        <Pressable style={styles.primaryButtonSmall} onPress={onClose}>
          <Text style={styles.primaryButtonText}>Close scanner</Text>
        </Pressable>
      </View>
    </View>
  );
}
