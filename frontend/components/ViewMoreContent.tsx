import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ColorSchemeName,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { RFValue } from "react-native-responsive-fontsize";

const MAX_LINES = 3;

export default function ViewMoreContent({ content }: { content: string }) {
  const [showFullContent, setShowFullContent] = useState(false);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const toggleContentVisibility = () => {
    setShowFullContent(!showFullContent);
  };

  return (
    <View style={styles.container}>
      <ThemedText
        numberOfLines={showFullContent ? undefined : MAX_LINES}
        style={styles.text}
      >
        {content}
      </ThemedText>
      {content.split("\n").length > MAX_LINES || content.length > 200 ? (
        <TouchableOpacity
          onPress={toggleContentVisibility}
          style={styles.button}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ThemedText style={styles.buttonText}>
            {showFullContent ? "View Less" : "View More"}
          </ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    container: {
      paddingTop: 16,
    },
    text: {
      fontSize: RFValue(11),
      lineHeight: RFValue(16),
    },
    button: {
      marginTop: 8,
      alignSelf: "flex-start",
    },
    buttonText: {
      color: colorScheme === "dark" ? "#b9ffa8" : "blue",
      fontWeight: "bold",
      fontSize: RFValue(10),
    },
  });
