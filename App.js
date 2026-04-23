import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const SPEED_OPTIONS = [
  { id: 'fast', label: 'Rapida', duration: 450 },
  { id: 'normal', label: 'Normal', duration: 900 },
  { id: 'slow', label: 'Lenta', duration: 1500 },
];

const SQUARE_SIZE = 84;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function AnimatedIntroCard({ speedId, runId, onSelectSpeed }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(42)).current;
  const shadowLevel = useRef(new Animated.Value(0)).current;

  const activeSpeed =
    SPEED_OPTIONS.find((option) => option.id === speedId) ?? SPEED_OPTIONS[1];

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(42);
    shadowLevel.setValue(0);

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: activeSpeed.duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: activeSpeed.duration,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: false,
      }),
      Animated.timing(shadowLevel, {
        toValue: 1,
        duration: activeSpeed.duration + 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [activeSpeed.duration, opacity, runId, shadowLevel, translateY]);

  const cardShadowOpacity = shadowLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.22],
  });

  const cardShadowRadius = shadowLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 18],
  });

  const cardElevation = shadowLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 9],
  });

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Entrada</Text>

      <Animated.View
        style={[
          styles.introCard,
          {
            opacity,
            transform: [{ translateY }],
            shadowOpacity: cardShadowOpacity,
            shadowRadius: cardShadowRadius,
            elevation: cardElevation,
          },
        ]}
      >
        <Text style={styles.introEyebrow}>Inicio</Text>
        <Text style={styles.introTitle}>Hola</Text>
        <Text style={styles.introBody}>{activeSpeed.duration} ms</Text>
      </Animated.View>

      <View style={styles.speedRow}>
        {SPEED_OPTIONS.map((option) => {
          const isActive = option.id === activeSpeed.id;

          return (
            <Pressable
              key={option.id}
              onPress={() => onSelectSpeed(option.id)}
              style={[
                styles.nonSelectableSurface,
                styles.speedChip,
                isActive && styles.speedChipActive,
              ]}
            >
              <Text
                selectable={false}
                style={[
                  styles.nonSelectableText,
                  styles.speedChipText,
                  isActive && styles.speedChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PressScaleButton() {
  const [pressCount, setPressCount] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const shadowLevel = useRef(new Animated.Value(0)).current;

  function animateButton(toScale, toShadow) {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: toScale,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(shadowLevel, {
        toValue: toShadow,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }

  const buttonShadowOpacity = shadowLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.08],
  });

  const buttonShadowRadius = shadowLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 5],
  });

  const buttonElevation = shadowLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 2],
  });

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Boton</Text>

      <Pressable
        onPress={() => setPressCount((value) => value + 1)}
        onPressIn={() => animateButton(0.95, 1)}
        onPressOut={() => animateButton(1, 0)}
        style={styles.nonSelectableSurface}
      >
        <Animated.View
          style={[
            styles.pressButton,
            {
              transform: [{ scale }],
              shadowOpacity: buttonShadowOpacity,
              shadowRadius: buttonShadowRadius,
              elevation: buttonElevation,
            },
          ]}
        >
          <Text selectable={false} style={[styles.nonSelectableText, styles.pressButtonTitle]}>
            Tocar
          </Text>
          <Text selectable={false} style={[styles.nonSelectableText, styles.pressButtonMeta]}>
            Toques: {pressCount}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function DraggableSquare() {
  const position = useRef(new Animated.ValueXY({ x: 14, y: 14 })).current;
  const currentPosition = useRef({ x: 14, y: 14 });
  const pointerOffset = useRef({ x: 0, y: 0 });
  const dragBounds = useRef({ width: 280, height: 220 });
  const dragLevel = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  const squareScale = dragLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const squareShadowOpacity = dragLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.28],
  });

  const squareShadowRadius = dragLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 24],
  });

  const squareElevation = dragLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 14],
  });

  const squareColor = dragLevel.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1F6F78', '#F26419'],
  });

  const squareBorderRadius = dragLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 28],
  });

  function isPointInsideSquare(locationX, locationY) {
    const { x, y } = currentPosition.current;

    return (
      locationX >= x &&
      locationX <= x + SQUARE_SIZE &&
      locationY >= y &&
      locationY <= y + SQUARE_SIZE
    );
  }

  function finishDrag() {
    if (!isDragging.current) {
      return;
    }

    isDragging.current = false;

    Animated.spring(dragLevel, {
      toValue: 0,
      friction: 7,
      tension: 110,
      useNativeDriver: false,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event) => {
        const { locationX, locationY } = event.nativeEvent;

        return isPointInsideSquare(locationX, locationY);
      },
      onMoveShouldSetPanResponder: () => isDragging.current,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;

        if (!isPointInsideSquare(locationX, locationY)) {
          isDragging.current = false;
          return;
        }

        pointerOffset.current = {
          x: locationX - currentPosition.current.x,
          y: locationY - currentPosition.current.y,
        };
        isDragging.current = true;

        Animated.spring(dragLevel, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (event) => {
        if (!isDragging.current) {
          return;
        }

        const { locationX, locationY } = event.nativeEvent;
        const maxX = Math.max(0, dragBounds.current.width - SQUARE_SIZE);
        const maxY = Math.max(0, dragBounds.current.height - SQUARE_SIZE);
        const nextX = clamp(locationX - pointerOffset.current.x, 0, maxX);
        const nextY = clamp(locationY - pointerOffset.current.y, 0, maxY);
        const nextPosition = { x: nextX, y: nextY };

        position.setValue(nextPosition);
        currentPosition.current = nextPosition;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: finishDrag,
      onPanResponderTerminate: finishDrag,
    })
  ).current;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Drag</Text>

      <View
        {...panResponder.panHandlers}
        style={styles.dragZone}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          const maxX = Math.max(0, width - SQUARE_SIZE);
          const maxY = Math.max(0, height - SQUARE_SIZE);
          const clampedPosition = {
            x: clamp(currentPosition.current.x, 0, maxX),
            y: clamp(currentPosition.current.y, 0, maxY),
          };

          dragBounds.current = { width, height };
          currentPosition.current = clampedPosition;
          position.setValue(clampedPosition);
        }}
      >
        <Animated.View
          style={[
            styles.dragSquare,
            {
              backgroundColor: squareColor,
              borderRadius: squareBorderRadius,
              shadowOpacity: squareShadowOpacity,
              shadowRadius: squareShadowRadius,
              elevation: squareElevation,
              left: position.x,
              top: position.y,
              transform: [{ scale: squareScale }],
            },
          ]}
        >
          <Text selectable={false} style={[styles.nonSelectableText, styles.dragSquareText]}>
            mover
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function MorphingLoader({ maxWidth }) {
  const shapeProgress = useRef(new Animated.Value(0)).current;
  const fillProgress = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    shapeProgress.setValue(0);
    fillProgress.setValue(0.12);

    const shapeAnimation = Animated.parallel([
      Animated.timing(shapeProgress, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(fillProgress, {
        toValue: 0.42,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    const fillLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fillProgress, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(fillProgress, {
          toValue: 0.34,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    shapeAnimation.start(({ finished }) => {
      if (finished) {
        fillLoop.start();
      }
    });

    return () => {
      shapeAnimation.stop();
      fillLoop.stop();
    };
  }, [fillProgress, maxWidth, shapeProgress]);

  const loaderWidth = shapeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [72, maxWidth],
  });

  const loaderHeight = shapeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [72, 22],
  });

  const loaderRadius = shapeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 11],
  });

  const loaderShadowOpacity = shapeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.22],
  });

  const loaderShadowRadius = shapeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 14],
  });

  const loaderElevation = shapeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 8],
  });

  const innerLoaderWidth = shapeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [64, Math.max(40, maxWidth - 8)],
  });

  const fillWidth = Animated.multiply(innerLoaderWidth, fillProgress);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Carga</Text>

      <View style={styles.loaderArea}>
        <Animated.View
          style={[
            styles.loaderShell,
            {
              width: loaderWidth,
              height: loaderHeight,
              borderRadius: loaderRadius,
              shadowOpacity: loaderShadowOpacity,
              shadowRadius: loaderShadowRadius,
              elevation: loaderElevation,
            },
          ]}
        >
          <Animated.View style={[styles.loaderFill, { width: fillWidth }]} />
        </Animated.View>

        <Text style={styles.loaderLabel}>Cargando...</Text>
      </View>
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const pageWidth = isDesktop
    ? Math.max(380, Math.min(width * 0.34, 560))
    : Math.max(320, Math.min(width - 24, 720));
  const [selectedSpeedId, setSelectedSpeedId] = useState('normal');
  const [introRunId, setIntroRunId] = useState(0);

  function handleSelectSpeed(nextSpeedId) {
    setSelectedSpeedId(nextSpeedId);
    setIntroRunId((value) => value + 1);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.viewportContent}>
        <View style={[styles.pageShell, { width: pageWidth }]}>
          <Text style={styles.heroTitle}>Animaciones</Text>

          <AnimatedIntroCard
            speedId={selectedSpeedId}
            runId={introRunId}
            onSelectSpeed={handleSelectSpeed}
          />
          <PressScaleButton />
          <DraggableSquare />
          <MorphingLoader maxWidth={Math.min(pageWidth - 76, 340)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE8',
  },
  viewportContent: {
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  pageShell: {
    maxWidth: '100%',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  nonSelectableSurface: {
    userSelect: 'none',
  },
  nonSelectableText: {
    userSelect: 'none',
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    color: '#162022',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFCF8',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E4D9CD',
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162022',
    marginBottom: 12,
  },
  introCard: {
    backgroundColor: '#F2F8F5',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D5E5DC',
    shadowColor: '#142022',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    marginBottom: 14,
  },
  introEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#1F6F78',
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#172022',
    marginBottom: 6,
  },
  introBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5F6E74',
  },
  speedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: -8,
  },
  speedChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D7CCC0',
    backgroundColor: '#FFF6EE',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  speedChipActive: {
    backgroundColor: '#1F6F78',
    borderColor: '#1F6F78',
  },
  speedChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A5C47',
  },
  speedChipTextActive: {
    color: '#FFFFFF',
  },
  pressButton: {
    backgroundColor: '#F26419',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A1204',
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },
  pressButtonTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pressButtonMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFE6D7',
  },
  dragZone: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8D4D9',
    backgroundColor: '#F5FAFB',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
    touchAction: 'none',
  },
  dragSquare: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E171A',
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },
  dragSquareText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  loaderArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loaderShell: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBE4E7',
    overflow: 'hidden',
    shadowColor: '#102022',
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  loaderFill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: '#1F6F78',
  },
  loaderLabel: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '700',
    color: '#5E6B72',
  },
});
