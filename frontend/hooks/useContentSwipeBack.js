import { useCallback, useMemo, useRef } from "react";
import { Animated, PanResponder, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

export default function useContentSwipeBack(navigation) {
  const { width } = useWindowDimensions();
  const swipeOffset = useRef(new Animated.Value(0)).current;
  const isNavigatingBack = useRef(false);

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          !isNavigatingBack.current &&
          gesture.numberActiveTouches === 1 &&
          gesture.x0 <= 32 &&
          gesture.dx > 10 &&
          gesture.dx > Math.abs(gesture.dy) * 1.5,
        onPanResponderGrant: () => swipeOffset.stopAnimation(),
        onPanResponderMove: (_, gesture) => {
          swipeOffset.setValue(Math.max(0, Math.min(gesture.dx, width)));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > width * 0.3 || (gesture.dx > 25 && gesture.vx > 0.8)) {
            isNavigatingBack.current = true;
            Animated.timing(swipeOffset, {
              toValue: width,
              duration: 180,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) navigation.goBack();
              else isNavigatingBack.current = false;
            });
          } else {
            Animated.spring(swipeOffset, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(swipeOffset, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [navigation, swipeOffset, width],
  );

  useFocusEffect(
    useCallback(() => {
      isNavigatingBack.current = false;
      swipeOffset.setValue(0);
      return () => swipeOffset.stopAnimation();
    }, [swipeOffset]),
  );

  return { swipeOffset, swipeResponder, isNavigatingBack };
}
