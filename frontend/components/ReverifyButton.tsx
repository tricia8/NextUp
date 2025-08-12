import { sendEmailVerification, User } from "firebase/auth";
import { StatusBar, TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { hideMessage, showMessage } from "react-native-flash-message";

type ButtonProps = {
  user: User;
};

export default function ReverifyButton({ user }: ButtonProps) {
  const resendEmail = () => {
    if (user) {
      sendEmailVerification(user)
        .then(() => {
          // Email verification sent
          hideMessage();
          setTimeout(() => {
            showMessage({
              message: "Verification email sent!",
              type: "success",
              statusBarHeight: StatusBar.currentHeight,
              floating: true,
              icon: "success",
            });
          }, 500);
        })
        .catch((error) => {
          // Handle errors, e.g., network issues, too many requests
          console.error("Error sending verification email:", error);
        });
    }
  };

  return (
    <TouchableOpacity
      style={{
        justifyContent: "center",
        borderRadius: 15,
        padding: 10,
        borderColor: "#d32f2f", // richer red
        backgroundColor: "#e7adadff",

        alignSelf: "flex-start",
        borderWidth: 1,
        marginTop: 5,
      }}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      onPress={resendEmail}
    >
      <Text>Resend Verification Email</Text>
    </TouchableOpacity>
  );
}
