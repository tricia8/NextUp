import { FloatingLabelInput } from "react-native-floating-label-input";
import {
  useColorScheme,
  ColorSchemeName,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { ComponentProps } from "react";

// Inherit optional versions of all FloatingLabelInput props
interface Props extends Partial<ComponentProps<typeof FloatingLabelInput>> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  lightLabelBg?: string;
  darkLabelBg?: string;
  containerStyles?: ViewStyle;
}

export default function SublistField(props: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const labelBg =
    colorScheme === "dark"
      ? props.darkLabelBg ?? "#141515"
      : props.lightLabelBg ?? "#a2e6ff";

  return (
    <FloatingLabelInput
      {...props}
      label={props.label}
      value={props.value}
      onChangeText={props.onChangeText}
      inputStyles={{ color: colorScheme == "dark" ? "white" : "black" }}
      containerStyles={{
        ...styles.inputContainer,
        ...(props.containerStyles || {}),
      }}
      staticLabel
      labelStyles={StyleSheet.flatten([
        styles.floatingLabel,
        {
          backgroundColor: labelBg,
        },
      ])}
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
      paddingHorizontal: 5,
    },
  });
