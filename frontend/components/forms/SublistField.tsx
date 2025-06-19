import { FloatingLabelInput } from "react-native-floating-label-input";
import { useColorScheme, ColorSchemeName, StyleSheet } from "react-native";
import { useState, ComponentProps } from "react";

// Inherit optional versions of all FloatingLabelInput props
interface Props extends Partial<ComponentProps<typeof FloatingLabelInput>> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}

export default function SublistField(props: Props) {
  const colorScheme = useColorScheme();

  const styles = getStyles(colorScheme);

  return (
    <FloatingLabelInput
      {...props}
      label={props.label}
      value={props.value}
      onChangeText={props.onChangeText}
      inputStyles={{ color: colorScheme == "dark" ? "white" : "black" }}
      containerStyles={styles.inputContainer}
      staticLabel
      labelStyles={styles.floatingLabel}
      customLabelStyles={{
        colorFocused: colorScheme == "dark" ? "#aee690" : "#06572c",
        colorBlurred: colorScheme == "dark" ? "#74b552" : "#16ac5c",
      }}
    />
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    inputContainer: {
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colorScheme == "dark" ? "white" : "black",
      padding: 10,
    },
    floatingLabel: {
      backgroundColor: colorScheme == "dark" ? "#141515" : "#a2e6ff",
      paddingHorizontal: 5,
    },
  });
