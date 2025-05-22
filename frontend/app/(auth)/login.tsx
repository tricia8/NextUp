import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator,
  useColorScheme,
  ColorSchemeName,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingLabelInput } from "react-native-floating-label-input";
import Fontisto from "react-native-vector-icons/Fontisto";
import AntDesign from "react-native-vector-icons/AntDesign";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import { useRouter } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false); // show or hide password
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme(); // 'light' or 'dark'
  const router = useRouter();

  // autohide password after 5 seconds if it's revealed
  const handleShowPassword = () => {
    setShow(true);
    // Automatically hide after 5 seconds
    setTimeout(() => setShow(false), 5000);
  };

  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={"height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.centerContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView
            lightColor="#f1efb3"
            darkColor="#6663c8"
            style={styles.themedView}
          >
            <ThemedText type="title" style={styles.heading}>
              Login
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.subHeading}>
              Welcome back
            </ThemedText>

            <View style={styles.fieldContainer}>
              <FloatingLabelInput
                label={"Email"}
                value={email}
                onChangeText={(value) => setEmail(value)}
                leftComponent={
                  <Fontisto name="email" size={22} color="black" />
                }
                containerStyles={styles.inputContainer}
                inputStyles={styles.input}
              />

              <FloatingLabelInput
                label={"Password"}
                isPassword
                togglePassword={show}
                value={password}
                onChangeText={(value) => setPassword(value)}
                customShowPasswordComponent={
                  <TouchableOpacity onPress={handleShowPassword}>
                    <Ionicons name="eye" size={24} color="black" />
                  </TouchableOpacity>
                }
                customHidePasswordComponent={
                  <Ionicons name="eye-off" size={24} color="black" />
                }
                leftComponent={
                  <EvilIcons name="lock" size={22} color="black" />
                }
                containerStyles={styles.inputContainer}
                inputStyles={styles.input}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.loginButton}
                  disabled={!email || !password}
                >
                  <ThemedText style={[styles.subHeading, styles.loginText]}>
                    Log in
                  </ThemedText>
                </TouchableOpacity>

                <View style={styles.haveAccountContainer}>
                  <ThemedText style={styles.noAccountText}>
                    Don't have an account?
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push("./signup")}
                    style={styles.signUpContainer}
                  >
                    <ThemedText type="link" style={styles.linkedText}>
                      Sign up
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    centerContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
    },
    themedView: {
      flex: 1,
      justifyContent: "center",
      padding: 13,
    },
    fieldContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 18,
    },
    heading: {
      fontSize: RFValue(25),
      textAlign: "center",
      marginTop: 12,
      marginBottom: 10,
      lineHeight: RFValue(30),
    },
    inputContainer: {
      backgroundColor: "#fff",
      borderRadius: 12,
      borderWidth: 0,
      paddingVertical: 20,
      paddingHorizontal: 10,
      elevation: 5,
    },
    loginButton: {
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 12,
      margin: 16,
      backgroundColor: "#46d5c2",
      color: "#fff",
      justifyContent: "center",
    },
    subHeading: {
      textAlign: "center",
      marginBottom: 10,
      fontSize: RFValue(13),
    },
    loginText: {
      color: "#2e61a4",
      fontWeight: "bold",
      margin: 10,
    },
    noAccountText: {
      margin: 10,
      marginLeft: 0,
      fontSize: RFValue(13),
    },
    haveAccountContainer: {
      flexDirection: "row",
      justifyContent: "center",
    },
    linkedText: {
      fontSize: RFValue(13),
      color: colorScheme === "dark" ? "#aeefff" : "#3d93aa",
    },
    input: {
      color: "#274266",
      paddingVertical: 0,
      minHeight: 28,
    },
    signUpContainer: {
      backgroundColor: "transparent",
      marginVertical: 8.5,
    },
  });
