import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useContext, useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingLabelInput } from "react-native-floating-label-input";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import { AuthContext } from "@/context/AuthContext";
import { FirebaseError } from "firebase/app";
import { showMessage } from "react-native-flash-message";
import { getFriendlyAuthErrorMessage } from "@/utils/firebaseErrorMapper";

export default function ResetPassword() {
  const { forgotPassword } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // to store error message for required field
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const validateForm = () => {
    if (!email) {
      setErrorMessage("Email is required");
      return false;
    }
    return true; // check if all fields are filled
  };

  const handlePasswordReset = async () => {
    if (validateForm()) {
      Keyboard.dismiss();
      setLoading(true);
      try {
        await forgotPassword(email);
      } catch (error) {
        if (error instanceof FirebaseError) {
          showMessage({
            message: "Error",
            description: getFriendlyAuthErrorMessage(error),
            type: "danger",
            statusBarHeight: StatusBar.currentHeight, //Android only
            floating: true,
          });
        } else {
          showMessage({
            message: "Unexpected Error",
            description: "Something went wrong. Please try again.",
            type: "danger",
            statusBarHeight: StatusBar.currentHeight,
            floating: true,
          });
        }
      } finally {
        setLoading(false);
      }
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
            lightColor="#f1efb3"
            darkColor="#6663c8"
            style={styles.themedView}
          >
            <ThemedText style={styles.subHeading}>
              Enter your email and we'll send you a link to reset your password
            </ThemedText>
            <View style={styles.fieldContainer}>
              <FloatingLabelInput
                label={"Email"}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errorMessage) {
                    setErrorMessage(""); // remove error message when user types something
                  }
                }}
                leftComponent={
                  <Fontisto name="email" size={22} color="black" />
                }
                containerStyles={styles.inputContainer}
                inputStyles={styles.input}
              />
              {errorMessage && (
                <ThemedText
                  style={styles.errorText}
                  lightColor="#c40028"
                  darkColor="#ffb1c1"
                >
                  {errorMessage}
                </ThemedText>
              )}
            </View>
            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.sendLink}
                  onPress={handlePasswordReset}
                >
                  <ThemedText style={[styles.subHeading, styles.sendLinkText]}>
                    Send link to email
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.push("/login")}
                >
                  <Ionicons
                    name="arrow-back-circle-outline"
                    size={22}
                    color="black"
                  />
                  <ThemedText>Back to login</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  themedView: {
    flex: 1,
    justifyContent: "center",
    padding: 15,
  },
  fieldContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 18,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0,
    paddingVertical: 20,
    paddingHorizontal: 10,
    elevation: 5,
  },
  sendLink: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    margin: 16,
    backgroundColor: "#46d5c2",
    color: "#fff",
    justifyContent: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    marginTop: 5,
  },
  subHeading: {
    marginTop: 12,
    textAlign: "center",
    marginBottom: 10,
    fontSize: RFValue(13),
  },
  sendLinkText: {
    color: "#2e61a4",
    fontWeight: "bold",
    margin: 10,
  },
  errorText: {
    fontSize: RFValue(12),
  },
  input: {
    color: "#274266",
    paddingVertical: 0,
    minHeight: 28,
  },
});
