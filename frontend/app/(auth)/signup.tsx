import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingLabelInput } from "react-native-floating-label-input";
import Fontisto from "react-native-vector-icons/Fontisto";
import AntDesign from "react-native-vector-icons/AntDesign";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import { useRouter } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false); // show or hide password

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.centerContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView
            lightColor="#c2bef1"
            darkColor=""
            style={{ flex: 1, justifyContent: "center" }}
          >
            <ThemedText type="title" style={styles.heading}>
              Sign Up
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.subHeading}>
              Just a few quick things to get started
            </ThemedText>

            <View style={{ margin: 10 }}>
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
            </View>

            <View style={{ margin: 10 }}>
              <FloatingLabelInput
                label={"Username"}
                value={username}
                onChangeText={(value) => setUser(value)}
                leftComponent={
                  <AntDesign name="user" size={22} color="black" />
                }
                containerStyles={styles.inputContainer}
                inputStyles={styles.input}
              />
            </View>

            <View style={{ margin: 10 }}>
              <FloatingLabelInput
                label={"Password"}
                isPassword
                togglePassword={show}
                value={password}
                onChangeText={(value) => setPassword(value)}
                leftComponent={
                  <EvilIcons name="lock" size={22} color="black" />
                }
                containerStyles={styles.inputContainer}
                inputStyles={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.accountButton}>
              <ThemedText
                style={[
                  styles.subHeading,
                  { color: "#2e61a4", fontWeight: "bold" },
                ]}
              >
                Create account
              </ThemedText>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", justifyContent: "center" }}>
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
  signUpContainer: {},
  heading: {
    fontSize: RFValue(25),
    textAlign: "center",
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
  },
  subHeading: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: RFValue(13),
  },
  haveAccountText: {
    margin: 10,
    marginLeft: 0,
    fontSize: RFValue(13),
  },
  linkedText: {
    fontSize: RFValue(13),
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
