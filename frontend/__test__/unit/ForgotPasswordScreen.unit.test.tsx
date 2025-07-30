import ResetPassword from "@/app/(auth)/forgot-password";
import { AuthProvider } from "@/context/AuthContext";
import { fireEvent, render } from "@testing-library/react-native";
import { sendPasswordResetEmail } from "firebase/auth";

jest.mock("expo-font");
jest.mock("expo-asset");

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock("firebase/auth", () => ({
  /* createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: "test-uid", emailVerified: false } })
  ), */
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null); // simulate no logged-in user
    return () => {}; // return unsubscribe function
  }),
}));

describe("ResetPassword", () => {
  const renderScreen = () =>
    render(
      <AuthProvider>
        <ResetPassword />
      </AuthProvider>
    );

  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks(); // clears call history and resets all mocks to initial implementation
  });

  it("updates email state on input change", () => {
    const { getByTestId } = renderScreen();

    const emailInput = getByTestId("email-input");
    fireEvent.changeText(emailInput, "test@example.com");
    expect(emailInput.props.value).toBe("test@example.com");
  });

  it("displays error when email field is empty", () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText("Send link to email"));

    expect(getByText("Email is required")).toBeTruthy();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("calls forgotPassword with correct email when 'Send link to email' is pressed", () => {});
});
