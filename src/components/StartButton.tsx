import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

interface StartButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function StartButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
}: StartButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text
        style={[
          styles.text,
          !isPrimary && styles.secondaryText,
          disabled && styles.disabledText,
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#22C55E',
  },
  secondary: {
    backgroundColor: '#334155',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    backgroundColor: '#1E293B',
  },
  text: {
    color: '#052E16',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#F8FAFC',
  },
  disabledText: {
    color: '#475569',
  },
});
