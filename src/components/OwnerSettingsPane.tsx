import React from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';
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

  const activeOwnerDeviceIndex = Math.max(
    0,
    homeDevices.findIndex((device) => device.device_id === ownerDeviceId),
  );
  const ownerServiceSummary = summarizeOwnerServiceOutput(ownerServiceOutput);

  return (
    <>
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>设备工具</Text>
        <Text style={styles.cardCopy}>
          当 Sparkbox 需要进一步排查或恢复时，可使用这里的工具。
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
            <Text style={styles.secondaryButtonText}>刷新设备状态</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={onReconnectOwnerDevice}
            disabled={!ownerDeviceId || ownerConsoleBusy}
          >
            <Text style={styles.secondaryButtonText}>尝试重连 Sparkbox</Text>
          </Pressable>
        </View>
        {renderOwnerConsoleFeedback('tools')}
        {ownerStatus ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>
              {describeDeviceLabel(ownerDeviceId, activeOwnerDeviceIndex, homeDevices.length || 1)} 概览
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
                CPU {ownerStatus.system.cpu_percent ?? 0}% · 内存 {ownerStatus.system.memory?.used_percent ?? 0}%/{ownerStatus.system.memory?.total_gb ?? 0} GB · 磁盘 {ownerStatus.system.disk?.used_percent ?? 0}%/{ownerStatus.system.disk?.total_gb ?? 0} GB
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>Sparkbox 的 AI 服务</Text>
        <Text style={styles.cardCopy}>
          为 Sparkbox 维护默认 AI 服务和模型；如登录信息变化，可在这里更新。
        </Text>
        <Text style={styles.selectionLabel}>默认 AI 服务</Text>
        <TextInput
          placeholder="默认 AI 服务"
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
        <Text style={styles.selectionLabel}>默认模型</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="首选模型"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerProviderConfig.defaultModel}
          onChangeText={onChangeDefaultModel}
        />
        <Text style={styles.selectionLabel}>响应超时</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          placeholder="超时秒数"
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
          <Text style={styles.primaryButtonText}>保存 AI 配置</Text>
        </Pressable>
        {renderOwnerConsoleFeedback('provider')}
        {ownerModels.length ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>此设备本地模型</Text>
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
        <Text style={styles.cardTitle}>添加其他 AI 服务</Text>
        <Text style={styles.cardCopy}>
          当 Sparkbox 需要接入新的 AI 服务或刷新登录信息时，在这里操作。
        </Text>
        <Text style={styles.selectionLabel}>AI 服务</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="服务名称"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardProvider}
          onChangeText={onChangeOnboardProvider}
        />
        <Text style={styles.selectionLabel}>模型名称</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="模型 ID"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardModel}
          onChangeText={onChangeOnboardModel}
        />
        <Text style={styles.selectionLabel}>访问密钥</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="访问密钥"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={ownerOnboardApiKey}
          onChangeText={onChangeOnboardApiKey}
        />
        <Text style={styles.selectionLabel}>服务 URL（可选）</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="服务 URL（可选）"
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
          <Text style={styles.primaryButtonText}>连接服务</Text>
        </Pressable>
        {renderOwnerConsoleFeedback('onboard')}
        {ownerServiceSummary ? <Text style={styles.cardCopy}>{ownerServiceSummary}</Text> : null}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>重启与恢复</Text>
        <Text style={styles.cardCopy}>
          如果 Sparkbox 状态异常，可在这里查看运行情况并重启关键服务。
        </Text>
        {ownerInference ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>Sparkbox 当前运行状态</Text>
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
        <Text style={styles.cardTitle}>设备健康与重置</Text>
        <Text style={styles.cardCopy}>
          管理员可在这里查看 Sparkbox 健康状态，并将设备重置回配置流程。
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
                <Text style={styles.secondaryButtonText}>立即检查 Sparkbox</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() =>
                  Alert.alert(
                    '要重置这个 Sparkbox 吗？',
                    '设备将回到配置状态，并暂时从当前家庭移除，直到重新完成接入。',
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '重置', style: 'destructive', onPress: () => onFactoryResetDevice(device) },
                    ],
                  )
                }
                disabled={diagnosticsBusy}
              >
                <Text style={styles.secondaryButtonText}>重置 Sparkbox</Text>
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
              )} 健康检查
            </Text>
            <Text style={styles.cardCopy}>
              检查来源：{describeDiagnosticsSource(diagnosticsPayload.cache?.source || 'live')}
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
                待处理项：{describeDiagnosticsPreflightReasons(diagnosticsPayload.network.preflight.reasons)}
              </Text>
            ) : null}
            {diagnosticsPayload.self_heal?.plan?.issues?.length ? (
              <Text style={styles.cardCopy}>
                当前需关注：{describeDiagnosticsIssueReasons(diagnosticsPayload.self_heal.plan.issues)}
              </Text>
            ) : null}
            {diagnosticsPayload.system?.memory ? (
              <Text style={styles.cardCopy}>
                内存：{diagnosticsPayload.system.memory.used_percent}% / {diagnosticsPayload.system.memory.total_gb} GB
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );
}
