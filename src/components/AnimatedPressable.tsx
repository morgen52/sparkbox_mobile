import React from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AnimatedPressableProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  pressFeedback?: 'scale' | 'none';
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  pressFeedback = 'scale',
  ...rest
}: AnimatedPressableProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const alpha = React.useRef(new Animated.Value(1)).current;

  const animateIn = React.useCallback(() => {
    if (pressFeedback === 'none') {
      return;
    }
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(alpha, {
        toValue: 0.86,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [alpha, pressFeedback, scale]);

  const animateOut = React.useCallback(() => {
    if (pressFeedback === 'none') {
      return;
    }
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(alpha, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [alpha, pressFeedback, scale]);

  function handlePressIn(event: GestureResponderEvent): void {
    if (!disabled) {
      animateIn();
    }
    onPressIn?.(event);
  }

  function handlePressOut(event: GestureResponderEvent): void {
    if (!disabled) {
      animateOut();
    }
    onPressOut?.(event);
  }

  return (
    <AnimatedPressableBase
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        {
          transform: [{ scale: pressFeedback === 'scale' ? scale : 1 }],
          opacity: disabled ? 0.55 : pressFeedback === 'scale' ? alpha : 1,
        },
      ]}
      android_ripple={{ color: 'rgba(47,114,84,0.12)' }}
    >
      {children}
    </AnimatedPressableBase>
  );
}
