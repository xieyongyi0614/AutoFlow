import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {StartButton} from '../components/StartButton';
import {StatusCard} from '../components/StatusCard';
import {useAutoScroll} from '../hooks/useAutoScroll';
import {DEFAULT_MAX_DELAY, DEFAULT_MIN_DELAY} from '../store/delayConfig';

export function Home() {
  const {
    minDelay,
    maxDelay,
    running,
    count,
    accessibilityEnabled,
    hydrated,
    error,
    setDelayRange,
    start,
    stop,
    openAccessibilitySetting,
  } = useAutoScroll();

  const [minText, setMinText] = useState(String(DEFAULT_MIN_DELAY));
  const [maxText, setMaxText] = useState(String(DEFAULT_MAX_DELAY));

  useEffect(() => {
    if (hydrated) {
      setMinText(String(minDelay));
      setMaxText(String(maxDelay));
    }
  }, [hydrated, minDelay, maxDelay]);

  const commitDelayRange = useCallback(() => {
    const min = Number.parseInt(minText, 10);
    const max = Number.parseInt(maxText, 10);
    setDelayRange(
      Number.isNaN(min) ? minDelay : min,
      Number.isNaN(max) ? maxDelay : max,
    );
  }, [minText, maxText, minDelay, maxDelay, setDelayRange]);

  const disabledBySetup = !accessibilityEnabled || !hydrated;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>自动刷视频</Text>

      <StatusCard
        running={running}
        count={count}
        accessibilityEnabled={accessibilityEnabled}
        onRequestAccessibility={openAccessibilitySetting}
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>等待时间（秒）</Text>
        <View style={styles.inputRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>最小</Text>
            <TextInput
              style={[styles.input, running && styles.inputDisabled]}
              value={minText}
              onChangeText={setMinText}
              onBlur={commitDelayRange}
              onSubmitEditing={commitDelayRange}
              keyboardType="number-pad"
              maxLength={4}
              editable={!running}
              selectTextOnFocus
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>最大</Text>
            <TextInput
              style={[styles.input, running && styles.inputDisabled]}
              value={maxText}
              onChangeText={setMaxText}
              onBlur={commitDelayRange}
              onSubmitEditing={commitDelayRange}
              keyboardType="number-pad"
              maxLength={4}
              editable={!running}
              selectTextOnFocus
            />
          </View>
        </View>
        <Text style={styles.hint}>
          每次滑动前将在 {minDelay}~{maxDelay} 秒内随机等待
          {running ? '；运行中不可修改' : ''}
        </Text>
      </View>

      <StartButton
        title="开始自动刷"
        onPress={start}
        disabled={running || disabledBySetup}
      />
      <StartButton
        title="停止"
        variant="secondary"
        onPress={stop}
        disabled={!running}
      />

      <Text style={styles.footer}>
        使用方法：打开目标视频 App，切回本工具点击「开始自动刷」，随后切到视频
        App 即可自动滑动；停止时回到本工具点击「停止」，或在通知栏点击「停止」。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  hint: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 'auto',
    marginBottom: 8,
  },
});
