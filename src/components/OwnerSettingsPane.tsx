import React from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import {
  describeAiProvider,
  formatByteSize,
  summarizeOwnerServiceOutput,
} from '../appShell';
import type {
  DeviceConfigStatus,
  DeviceDiagnostics,
  DeviceInferenceDetail,
  DeviceProviderConfig,
  DeviceSummary,
} from '../householdApi';
import {
  describeDeviceLabel,
  describeDiagnosticsIssueReasons,
  describeDiagnosticsNetworkSummary,
  describeDiagnosticsPreflightReasons,
  describeDiagnosticsWifiConnection,
  describeDeviceStatus,
  describeOwnerConsoleInference,
  describeOwnerConsoleModelStatus,
  describeOwnerConsoleRuntimeStatus,
  describeOwnerRuntimeActiveRequest,
  describeOwnerRuntimeQueueEntry,
  describeOwnerRuntimeQueueSummary,
  describeOwnerServiceActionLabel,
} from '../householdState';

type OwnerConsoleContext = 'tools' | 'provider' | 'onboard' | 'service';

type OwnerSettingsPaneProps = {
  styles: Record<string, any>;
  canManage: boolean;
  homeDevices: DeviceSummary[];
  ownerDeviceId: string;
  ownerConsoleBusy: boolean;
  ownerStatus: DeviceConfigStatus | null;
  ownerProviders: string[];
  ownerModels: Array<{ name: string; size?: number | null }>;
  ownerProviderConfig: DeviceProviderConfig;
  ownerInference: DeviceInferenceDetail | null;
  ownerOnboardProvider: string;
  ownerOnboardModel: string;
  ownerOnboardApiKey: string;
  ownerOnboardApiUrl: string;
  ownerServiceOutput: string;
  diagnosticsBusy: boolean;
  diagnosticsError: string;
  diagnosticsPayload: DeviceDiagnostics | null;
  diagnosticsDeviceId: string;
  renderOwnerConsoleFeedback: (context: OwnerConsoleContext) => React.ReactNode;
  describeDiagnosticsSource: (source: string) => string;
  onSelectOwnerDevice: (deviceId: string) => void;
  onRefreshOwnerConsole: () => void;
  onReconnectOwnerDevice: () => void;
  onChangeDefaultProvider: (provider: string) => void;
  onChangeDefaultModel: (value: string) => void;
  onChangeProviderTimeout: (value: string) => void;
  onSaveOwnerProviderSettings: () => void;
  onChangeOnboardProvider: (value: string) => void;
  onChangeOnboardModel: (value: string) => void;
  onChangeOnboardApiKey: (value: string) => void;
  onChangeOnboardApiUrl: (value: string) => void;
  onRunOwnerOnboard: () => void;
  onRunOwnerServiceAction: (
    serviceName: 'ollama' | 'zeroclaw',
    action: 'restart' | 'stop' | 'start',
  ) => void;
  onLoadDiagnostics: (deviceId: string) => void;
  onFactoryResetDevice: (device: DeviceSummary) => void;
};

export function OwnerSettingsPane({
  styles,
  canManage,
  homeDevices,
  ownerDeviceId,
  ownerConsoleBusy,
  ownerStatus,
  ownerProviders,
  ownerModels,
  ownerProviderConfig,
  ownerInference,
  ownerOnboardProvider,
  ownerOnboardModel,
  ownerOnboardApiKey,
  ownerOnboardApiUrl,
  ownerServiceOutput,
  diagnosticsBusy,
  diagnosticsError,
  diagnosticsPayload,
  diagnosticsDeviceId,
  renderOwnerConsoleFeedback,
  describeDiagnosticsSource,
  onSelectOwnerDevice,
  onRefreshOwnerConsole,
  onReconnectOwnerDevice,
  onChangeDefaultProvider,
  onChangeDefaultModel,
  onChangeProviderTimeout,
  onSaveOwnerProviderSettings,
  onChangeOnboardProvider,
  onChangeOnboardModel,
  onChangeOnboardApiKey,
  onChangeOnboardApiUrl,
  onRunOwnerOnboard,
  onRunOwnerServiceAction,
  onLoadDiagnostics,
  onFactoryResetDevice,
}: OwnerSettingsPaneProps) {
  if (!canManage) {
    return null;
  }

  const activeOwnerDeviceIndex = Math.max(
    0,
    homeDevices.findIndex((device) => device.device_id === ownerDeviceId),
  );
  const ownerServiceSummary = summarizeOwnerServiceOutput(ownerServiceOutput);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device tools</Text>
        <Text style={styles.cardCopy}>
          Use these when Sparkbox needs a closer check or recovery.
        </Text>
        <View style={styles.scopeRow}>
          {homeDevices.map((device, deviceIndex) => {
            const active = ownerDeviceId === device.device_id;
            return (
              <Pressable
                key={`owner-device-${device.device_id}`}
                style={[styles.scopePill, active ? styles.scopePillActive : null]}
                onPress={() => onSelectOwnerDevice(device.device_id)}
                disabled={ownerConsoleBusy}
              >
                <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                  {describeDeviceLabel(device.device_id, deviceIndex, homeDevices.length)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.inlineActions}>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={onRefreshOwnerConsole}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>Refresh device</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={onReconnectOwnerDevice}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>Try to reconnect Sparkbox</Text>
          </Pressable>
        </View>
        {renderOwnerConsoleFeedback('tools')}
        {ownerStatus ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>
              {describeDeviceLabel(ownerDeviceId, activeOwnerDeviceIndex, homeDevices.length || 1)} summary
            </Text>
            <Text style={styles.cardCopy}>
              {describeOwnerConsoleModelStatus(ownerStatus.ollama?.service, ownerStatus.ollama?.api)}
            </Text>
            <Text style={styles.cardCopy}>
              {describeOwnerConsoleRuntimeStatus(
                ownerStatus.zeroclaw?.components?.daemon?.status,
                ownerStatus.zeroclaw?.components?.gateway?.status,
              )}
            </Text>
            <Text style={styles.cardCopy}>
              {describeOwnerConsoleInference(
                ownerStatus.inference?.queued_requests,
                ownerStatus.inference?.queue_limit,
                ownerStatus.inference?.active,
              )}
            </Text>
            {ownerStatus.system ? (
              <Text style={styles.cardCopy}>
                CPU {ownerStatus.system.cpu_percent ?? 0}% · Memory {ownerStatus.system.memory?.used_percent ?? 0}%/{ownerStatus.system.memory?.total_gb ?? 0} GB · Disk {ownerStatus.system.disk?.used_percent ?? 0}%/{ownerStatus.system.disk?.total_gb ?? 0} GB
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI service for Sparkbox</Text>
        <Text style={styles.cardCopy}>
          Keep one shared AI service and model ready for Sparkbox, then update it here if the sign-in changes.
        </Text>
        <Text style={styles.selectionLabel}>Default AI service</Text>
        <TextInput
          placeholder="Default AI service"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={describeAiProvider(ownerProviderConfig.defaultProvider)}
          editable={false}
        />
        {ownerProviders.length ? (
          <View style={styles.scopeRow}>
            {ownerProviders.map((provider) => {
              const active = ownerProviderConfig.defaultProvider === provider;
              return (
                <Pressable
                  key={`provider-${provider}`}
                  style={[styles.scopePill, active ? styles.scopePillActive : null]}
                  onPress={() => onChangeDefaultProvider(provider)}
                >
                  <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                    {describeAiProvider(provider)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Text style={styles.selectionLabel}>Default model</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Preferred model"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerProviderConfig.defaultModel}
          onChangeText={onChangeDefaultModel}
        />
        <Text style={styles.selectionLabel}>Response timeout</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          placeholder="Timeout in seconds"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={String(ownerProviderConfig.providerTimeoutSecs)}
          onChangeText={onChangeProviderTimeout}
        />
        <Pressable
          style={styles.primaryButtonSmall}
          onPress={onSaveOwnerProviderSettings}
          disabled={!ownerDeviceId || ownerConsoleBusy}
        >
          <Text style={styles.primaryButtonText}>Save AI setup</Text>
        </Pressable>
        {renderOwnerConsoleFeedback('provider')}
        {ownerModels.length ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>Local models on this device</Text>
            {ownerModels.map((model) => (
              <Text key={model.name} style={styles.cardCopy}>
                {model.name}
                {typeof model.size === 'number' ? ` · ${formatByteSize(model.size)}` : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add another AI service</Text>
        <Text style={styles.cardCopy}>
          Use this when Sparkbox needs to connect to another AI service or refresh its sign-in.
        </Text>
        <Text style={styles.selectionLabel}>AI service</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Service name"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardProvider}
          onChangeText={onChangeOnboardProvider}
        />
        <Text style={styles.selectionLabel}>Model name</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Model ID"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardModel}
          onChangeText={onChangeOnboardModel}
        />
        <Text style={styles.selectionLabel}>Access key</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Access key"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardApiKey}
          onChangeText={onChangeOnboardApiKey}
        />
        <Text style={styles.selectionLabel}>Service URL (optional)</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Service URL (optional)"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardApiUrl}
          onChangeText={onChangeOnboardApiUrl}
        />
        <Pressable
          style={styles.primaryButtonSmall}
          onPress={onRunOwnerOnboard}
          disabled={!ownerDeviceId || ownerConsoleBusy}
        >
          <Text style={styles.primaryButtonText}>Connect service</Text>
        </Pressable>
        {renderOwnerConsoleFeedback('onboard')}
        {ownerServiceSummary ? <Text style={styles.cardCopy}>{ownerServiceSummary}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Restart and recovery</Text>
        <Text style={styles.cardCopy}>
          If Sparkbox gets stuck, you can check activity here and restart its main services.
        </Text>
        {ownerInference ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>What Sparkbox is doing now</Text>
            <Text style={styles.cardCopy}>
              {describeOwnerRuntimeQueueSummary(
                ownerInference.queued_requests,
                ownerInference.queue_limit,
              )}
            </Text>
            <Text style={styles.cardCopy}>
              {describeOwnerRuntimeActiveRequest(ownerInference.active_request?.username)}
            </Text>
            {ownerInference.queue.map((item) => (
              <Text key={item.request_id || `${item.username}-${item.position}`} style={styles.cardCopy}>
                {describeOwnerRuntimeQueueEntry(item.username, item.position)}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.inlineActions}>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={() => onRunOwnerServiceAction('ollama', 'restart')}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>
              {describeOwnerServiceActionLabel('ollama', 'restart')}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={() => onRunOwnerServiceAction('zeroclaw', 'restart')}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>
              {describeOwnerServiceActionLabel('zeroclaw', 'restart')}
            </Text>
          </Pressable>
        </View>
        <View style={styles.inlineActions}>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={() => onRunOwnerServiceAction('ollama', 'stop')}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>
              {describeOwnerServiceActionLabel('ollama', 'stop')}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={() => onRunOwnerServiceAction('ollama', 'start')}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>
              {describeOwnerServiceActionLabel('ollama', 'start')}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={() => onRunOwnerServiceAction('zeroclaw', 'stop')}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>
              {describeOwnerServiceActionLabel('zeroclaw', 'stop')}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={() => onRunOwnerServiceAction('zeroclaw', 'start')}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>
              {describeOwnerServiceActionLabel('zeroclaw', 'start')}
            </Text>
          </Pressable>
        </View>
        {renderOwnerConsoleFeedback('service')}
        {ownerServiceSummary ? <Text style={styles.cardCopy}>{ownerServiceSummary}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device health and reset</Text>
        <Text style={styles.cardCopy}>
          Owners can inspect Sparkbox health and send it back to setup from here.
        </Text>
        {diagnosticsError ? <Text style={styles.errorText}>{diagnosticsError}</Text> : null}
        {homeDevices.map((device, deviceIndex) => (
          <View key={`diag-${device.device_id}`} style={styles.deviceRowCard}>
            <Text style={styles.networkName}>
              {describeDeviceLabel(device.device_id, deviceIndex, homeDevices.length)}
            </Text>
            <Text style={styles.cardCopy}>
              {describeDiagnosticsNetworkSummary(device.last_health_check_summary || '') ||
                describeDeviceStatus(device.status)}
            </Text>
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => onLoadDiagnostics(device.device_id)}
                disabled={diagnosticsBusy}
              >
                <Text style={styles.secondaryButtonText}>Check Sparkbox now</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() =>
                  Alert.alert(
                    'Reset this Sparkbox?',
                    'This sends the device back to setup and removes it from the household until it is ready again.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Reset', style: 'destructive', onPress: () => onFactoryResetDevice(device) },
                    ],
                  )
                }
                disabled={diagnosticsBusy}
              >
                <Text style={styles.secondaryButtonText}>Reset Sparkbox</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {diagnosticsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
        {diagnosticsPayload ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>
              {describeDeviceLabel(
                diagnosticsDeviceId,
                Math.max(
                  0,
                  homeDevices.findIndex((device) => device.device_id === diagnosticsDeviceId),
                ),
                homeDevices.length || 1,
              )} health check
            </Text>
            <Text style={styles.cardCopy}>
              Check source: {describeDiagnosticsSource(diagnosticsPayload.cache?.source || 'live')}
              {diagnosticsPayload.cache?.summary
                ? ` · ${describeDiagnosticsNetworkSummary(diagnosticsPayload.cache.summary)}`
                : ''}
            </Text>
            {describeDiagnosticsWifiConnection(
              diagnosticsPayload.network?.wifi_interface,
              diagnosticsPayload.network?.wifi_radio,
            ) ? (
              <Text style={styles.cardCopy}>
                {describeDiagnosticsWifiConnection(
                  diagnosticsPayload.network?.wifi_interface,
                  diagnosticsPayload.network?.wifi_radio,
                )}
              </Text>
            ) : null}
            {diagnosticsPayload.network?.preflight?.reasons?.length ? (
              <Text style={styles.cardCopy}>
                Still to check: {describeDiagnosticsPreflightReasons(diagnosticsPayload.network.preflight.reasons)}
              </Text>
            ) : null}
            {diagnosticsPayload.self_heal?.plan?.issues?.length ? (
              <Text style={styles.cardCopy}>
                Needs attention now: {describeDiagnosticsIssueReasons(diagnosticsPayload.self_heal.plan.issues)}
              </Text>
            ) : null}
            {diagnosticsPayload.system?.memory ? (
              <Text style={styles.cardCopy}>
                Memory: {diagnosticsPayload.system.memory.used_percent}% of {diagnosticsPayload.system.memory.total_gb} GB
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );
}
