import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  ColorSchemeName,
  useColorScheme,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingLabelInput } from "react-native-floating-label-input";
import Fontisto from "@expo/vector-icons/Fontisto";
import AntDesign from "@expo/vector-icons/AntDesign";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { useRouter } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { showMessage } from "react-native-flash-message";
import { checkUniqueUsername } from "@/firebase/firestore";

export default function Signup() {
  const { register } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [username, setUser] = useState("");
  const [userNameAvailable, setUsernameAvailable] = useState(null); // boolean or null
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false); // show or hide password
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
  }>({}); // to make fields required

  const colorScheme = useColorScheme(); // 'light' or 'dark'
  const router = useRouter();
  const styles = getStyles(colorScheme);

  // autohide password after 5 seconds if it's revealed
  const handleShowPassword = () => {
    setShow(true);
    // Automatically hide after 5 seconds
    setTimeout(() => setShow(false), 5000);
  };

  const validateForm = () => {
    const formErrors: typeof errors = {};
    if (!email) formErrors.email = "Email is required";
    if (!username) formErrors.username = "Username is required";
    if (!password) formErrors.password = "Password is required";
    setErrors(formErrors);
    return Object.keys(formErrors).length == 0; // check if all fields are filled
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await register(email, password);
      router.replace("/login");
    } catch (error) {
      const err = error as Error;
      // Alert.alert("Sign up failed: ", err.message);
      showMessage({
        message: "Sign Up Failed",
        description: err.message,
        type: "danger",
        statusBarHeight: StatusBar.currentHeight, //Android only
        floating: true,
      });
    } finally {
      setLoading(false);
    }
  };

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
            lightColor="#c2bef1"
            darkColor="#411e76"
            style={styles.themedView}
          >
            <ThemedText type="title" style={styles.heading}>
              Sign Up
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.subHeading}>
              Just a few quick things to get started
            </ThemedText>

            <View style={styles.fieldContainer}>
              <FloatingLabelInput
                label={"Email"}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: "" })); // remove error message when user types something
                  }
                }}
                leftComponent={
                  <Fontisto name="email" size={22} color="black" />
                }
                containerStyles={styles.inputContainer}
                inputStyles={styles.input}
              />
              {errors.email && (
                <ThemedText
                  style={styles.errorText}
                  lightColor="#c40028"
                  darkColor="#ffb1c1"
                >
                  {errors.email}
                </ThemedText>
              )}

              <FloatingLabelInput
                label={"Username"}
                value={username}
                onChange={(e) => checkUniqueUsername(e, setUsernameAvailable)} //fix error here, change checkUniqueUsername parameters
                onChangeText={(value) => {
                  setUser(value);
                  if (errors.username) {
                    setErrors((prev) => ({ ...prev, username: "" })); // remove error message when user types something
                  }
                }}
                rightComponent={
                  userNameAvailable === true ? (
                    <Image source={require("@/assets/images/tick-icon.png")} />
                  ) : undefined
                }
                leftComponent={
                  <AntDesign name="user" size={22} color="black" />
                }
                containerStyles={styles.inputContainer}
                inputStyles={styles.input}
              />
              {userNameAvailable === false && (
                <ThemedText
                  style={styles.errorText}
                  lightColor="#c40028"
                  darkColor="#ffb1c1"
                >
                  Username is taken.
                </ThemedText>
              )}
              {userNameAvailable === null && (
                <ThemedText style={styles.errorText}>
                  Enter 1 to 30 characters
                </ThemedText>
              )}

              {errors.username && (
                <ThemedText
                  style={styles.errorText}
                  lightColor="#c40028"
                  darkColor="#ffb1c1"
                >
                  {errors.username}
                </ThemedText>
              )}

              <FloatingLabelInput
                label={"Password"}
                isPassword
                togglePassword={show}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: "" })); // remove error message when user types something
                  }
                }}
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
              {errors.password && (
                <ThemedText
                  style={styles.errorText}
                  lightColor="#c40028"
                  darkColor="#ffb1c1"
                >
                  {errors.password}
                </ThemedText>
              )}
            </View>

            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.accountButton}
                  onPress={() => {
                    if (validateForm()) {
                      handleSignUp();
                    }
                  }}
                >
                  <ThemedText
                    style={[styles.subHeading, styles.createAccountText]}
                  >
                    Create account
                  </ThemedText>
                </TouchableOpacity>

                <View style={styles.haveAccountContainer}>
                  <ThemedText style={styles.haveAccountText}>
                    Already have an account?
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => router.push("./login")}
                    style={styles.loginContainer}
                  >
                    <ThemedText type="link" style={styles.linkedText}>
                      Log in
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
      shadowColor: "#252424",
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      shadowOffset: { width: 0, height: 2 },
      elevation: 5,
    },
    accountButton: {
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
    createAccountText: {
      color: "#2e61a4",
      fontWeight: "bold",
      margin: 10,
    },
    errorText: {
      fontSize: RFValue(12),
    },
    haveAccountText: {
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
      color: colorScheme == "dark" ? "#33d3cc" : "#0a7ea4",
    },
    input: {
      color: "#274266",
      paddingVertical: 0,
      minHeight: 28,
    },
    loginContainer: {
      backgroundColor: "transparent",
      marginVertical: 8.5,
    },
  });
