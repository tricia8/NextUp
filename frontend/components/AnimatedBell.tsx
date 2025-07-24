import React, { useRef, useEffect } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RingingBell({ isRinging }: { isRinging: boolean }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRinging) return;

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }, 4000); 

    return () => clearInterval(interval); 
  }, [isRinging]);

  const rotation = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-15deg", "15deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Ionicons name="notifications" size={30} color="#66cdaa" />
    </Animated.View>
  );
}
