import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface StatusCardProps {
  running: boolean;
  count: number;
  accessibilityEnabled: boolean;
  onRequestAccessibility: () => void;
}

export function StatusCard({
  running,
  count,
  accessibilityEnabled,
  onRequestAccessibility,
}: StatusCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            running ? styles.dotRunning : styles.dotIdle,
          ]}
        />
        <Text style={styles.label}>状态：</Text>
        <Text style={[styles.value, running && styles.textRunning]}>
          {running ? '运行中' : '未运行'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>已滑动：</Text>
        <Text style={styles.value}>{count} 次</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>无障碍权限：</Text>
        <Text
          style={[
            styles.value,
            accessibilityEnabled ? styles.textOk : styles.textWarn,
          ]}>
          {accessibilityEnabled ? '已开启' : '未开启'}
        </Text>
      </View>

      {!accessibilityEnabled && (
        <Pressable style={styles.linkButton} onPress={onRequestAccessibility}>
          <Text style={styles.linkText}>去开启无障碍权限 →</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotIdle: {
    backgroundColor: '#64748B',
  },
  dotRunning: {
    backgroundColor: '#22C55E',
  },
  label: {
    color: '#94A3B8',
    fontSize: 15,
  },
  value: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  textRunning: {
    color: '#22C55E',
  },
  textOk: {
    color: '#22C55E',
  },
  textWarn: {
    color: '#F59E0B',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  linkText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
  },
});
