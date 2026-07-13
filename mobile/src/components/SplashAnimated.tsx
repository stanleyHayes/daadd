import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface SplashAnimatedProps {
  onFinish: () => void;
}

export function SplashAnimated({ onFinish }: SplashAnimatedProps) {
  const { t } = useTranslation();
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(-30);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    // Ring 1 pulse
    ringScale.value = withDelay(0, withTiming(2.5, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    ringOpacity.value = withDelay(0, withSequence(
      withTiming(0.3, { duration: 400 }),
      withTiming(0, { duration: 800 }),
    ));

    // Ring 2 pulse (delayed)
    ring2Scale.value = withDelay(200, withTiming(2.5, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    ring2Opacity.value = withDelay(200, withSequence(
      withTiming(0.2, { duration: 400 }),
      withTiming(0, { duration: 800 }),
    ));

    // Logo icon entrance
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 200 }));
    logoRotate.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 180 }));

    // Title text
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(500, withSpring(0, { damping: 20, stiffness: 200 }));

    // Subtitle
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    // Loading dots
    dotsOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

    // Fade out and finish
    fadeOut.value = withDelay(2400, withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const logoIconStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2Opacity.value,
    transform: [{ scale: ring2Scale.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <LinearGradient
        colors={['#1D4ED8', '#2563EB', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={[styles.decorCircle, { top: -80, right: -60, width: 280, height: 280, backgroundColor: 'rgba(255,255,255,0.04)' }]} />
      <View style={[styles.decorCircle, { bottom: -100, left: -80, width: 320, height: 320, backgroundColor: 'rgba(255,255,255,0.03)' }]} />
      <View style={[styles.decorCircle, { top: height * 0.3, left: -40, width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.05)' }]} />

      <View style={styles.content}>
        {/* Expanding rings */}
        <View style={styles.ringContainer}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={[styles.ring, ring2Style]} />
        </View>

        {/* Logo icon */}
        <Animated.View style={[styles.logoContainer, logoIconStyle]}>
          <View style={styles.logoInner}>
            <Ionicons name="flash" size={48} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>AdPlatform</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>{t('mobile.splash.subtitle')}</Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View style={[styles.dotsContainer, dotsStyle]}>
          <LoadingDots />
        </Animated.View>
      </View>

      {/* Bottom text */}
      <Animated.View style={[styles.bottomContainer, subtitleStyle]}>
        <Text style={styles.bottomText}>{t('mobile.splash.tagline')}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function LoadingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 }),
      ));
      // Loop
      const interval = setInterval(() => {
        sv.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
        );
      }, 900);
      return interval;
    };

    const i1 = animate(dot1, 0);
    const i2 = animate(dot2, 300);
    const i3 = animate(dot3, 600);

    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); };
  }, []);

  const d1Style = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: interpolate(dot1.value, [0.3, 1], [0.8, 1.2]) }] }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: interpolate(dot2.value, [0.3, 1], [0.8, 1.2]) }] }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: interpolate(dot3.value, [0.3, 1], [0.8, 1.2]) }] }));

  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, d1Style]} />
      <Animated.View style={[styles.dot, d2Style]} />
      <Animated.View style={[styles.dot, d3Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  ringContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoInner: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: -80,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
