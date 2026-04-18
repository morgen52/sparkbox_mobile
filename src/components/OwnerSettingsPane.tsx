import React from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
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

  const t = useT();

  const activeOwnerDeviceIndex = Math.max(
    0,
    homeDevices.findIndex((device) => device.device_id === ownerDeviceId),
  );
  const ownerServiceSummary = summarizeOwnerServiceOutput(ownerServiceOutput);

  return (
    <>
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('ownerSettings.deviceTools')}</Text>
        <Text style={styles.cardCopy}>
          {t('ownerSettings.deviceToolsCopy')}
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
            <Text style={styles.secondaryButtonText}>{t('ownerSettings.refreshStatus')}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={onReconnectOwnerDevice}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>{t('ownerSettings.reconnect')}</Text>
          </Pressable>
        </View>
        {renderOwnerConsoleFeedback('tools')}
        {ownerStatus ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>
              {describeDeviceLabel(ownerDeviceId, activeOwnerDeviceIndex, homeDevices.length || 1)} {t('ownerSettings.overview')}
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
                CPU {ownerStatus.system.cpu_percent ?? 0}% · {t('ownerSettings.memory')} {ownerStatus.system.memory?.used_percent ?? 0}%/{ownerStatus.system.memory?.total_gb ?? 0} GB · {t('ownerSettings.disk')} {ownerStatus.system.disk?.used_percent ?? 0}%/{ownerStatus.system.disk?.total_gb ?? 0} GB
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('ownerSettings.aiService')}</Text>
        <Text style={styles.cardCopy}>
          {t('ownerSettings.aiServiceCopy')}
        </Text>
        <Text style={styles.selectionLabel}>{t('ownerSettings.defaultProvider')}</Text>
        <TextInput
          placeholder={t('ownerSettings.defaultProviderPlaceholder')}
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
        <Text style={styles.selectionLabel}>{t('ownerSettings.defaultModel')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('ownerSettings.preferredModel')}
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerProviderConfig.defaultModel}
          onChangeText={onChangeDefaultModel}
        />
        <Text style={styles.selectionLabel}>{t('ownerSettings.responseTimeout')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          placeholder={t('ownerSettings.timeoutSeconds')}
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
          <Text style={styles.primaryButtonText}>{t('ownerSettings.saveAiConfig')}</Text>
        </Pressable>
        {renderOwnerConsoleFeedback('provider')}
        {ownerModels.length ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>{t('ownerSettings.localModels')}</Text>
            {ownerModels.map((model) => (
              <Text key={model.name} style={styles.cardCopy}>
                {model.name}
                {typeof model.size === 'number' ? ` · ${formatByteSize(model.size)}` : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('ownerSettings.addProvider')}</Text>
        <Text style={styles.cardCopy}>
          {t('ownerSettings.addProviderCopy')}
        </Text>
        <Text style={styles.selectionLabel}>{t('ownerSettings.providerLabel')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('ownerSettings.providerName')}
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardProvider}
          onChangeText={onChangeOnboardProvider}
        />
        <Text style={styles.selectionLabel}>{t('ownerSettings.modelName')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('ownerSettings.modelId')}
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardModel}
          onChangeText={onChangeOnboardModel}
        />
        <Text style={styles.selectionLabel}>{t('ownerSettings.accessKey')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder={t('ownerSettings.accessKeyPlaceholder')}
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardApiKey}
          onChangeText={onChangeOnboardApiKey}
        />
        <Text style={styles.selectionLabel}>{t('ownerSettings.serviceUrl')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('ownerSettings.serviceUrlPlaceholder')}
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
          <Text style={styles.primaryButtonText}>{t('ownerSettings.connectService')}</Text>
        </Pressable>
        {renderOwnerConsoleFeedback('onboard')}
        {ownerServiceSummary ? <Text style={styles.cardCopy}>{ownerServiceSummary}</Text> : null}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('ownerSettings.restartRecover')}</Text>
        <Text style={styles.cardCopy}>
          {t('ownerSettings.restartRecoverCopy')}
        </Text>
        {ownerInference ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>{t('ownerSettings.currentStatus')}</Text>
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

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('ownerSettings.healthReset')}</Text>
        <Text style={styles.cardCopy}>
          {t('ownerSettings.healthResetCopy')}
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
                <Text style={styles.secondaryButtonText}>{t('ownerSettings.checkNow')}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() =>
                  Alert.alert(
                    t('ownerSettings.resetConfirmTitle'),
                    t('ownerSettings.resetConfirmCopy'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('ownerSettings.reset'), style: 'destructive', onPress: () => onFactoryResetDevice(device) },
                    ],
                  )
                }
                disabled={diagnosticsBusy}
              >
                <Text style={styles.secondaryButtonText}>{t('ownerSettings.resetSparkbox')}</Text>
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
              )} {t('ownerSettings.healthCheck')}
            </Text>
            <Text style={styles.cardCopy}>
              {t('ownerSettings.checkSource')}{describeDiagnosticsSource(diagnosticsPayload.cache?.source || 'live')}
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
                {t('ownerSettings.pendingItems')}{describeDiagnosticsPreflightReasons(diagnosticsPayload.network.preflight.reasons)}
              </Text>
            ) : null}
            {diagnosticsPayload.self_heal?.plan?.issues?.length ? (
              <Text style={styles.cardCopy}>
                {t('ownerSettings.attentionItems')}{describeDiagnosticsIssueReasons(diagnosticsPayload.self_heal.plan.issues)}
              </Text>
            ) : null}
            {diagnosticsPayload.system?.memory ? (
              <Text style={styles.cardCopy}>
                {t('ownerSettings.memoryLabel')}{diagnosticsPayload.system.memory.used_percent}% / {diagnosticsPayload.system.memory.total_gb} GB
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );
}
