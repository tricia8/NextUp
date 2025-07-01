import React, { useRef, useEffect } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RingingBell() {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, 4000); 

    return () => clearInterval(interval); 
  }, [shakeAnim]);

  const rotation = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-10deg", "10deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Ionicons name="notifications" size={28} color="#66cdaa" />
    </Animated.View>
  );
}
