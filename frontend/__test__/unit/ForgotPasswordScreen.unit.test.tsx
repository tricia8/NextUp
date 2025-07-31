import ResetPassword from "@/app/(auth)/forgot-password";
import { AuthContext, AuthProvider } from "@/context/AuthContext";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { showMessage } from "react-native-flash-message";
import { FirebaseError } from "firebase/app";

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
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null); // simulate no logged-in user
    return () => {}; // return unsubscribe function
  }),
}));

// Mock error mapper
jest.mock("@/utils/firebaseErrorMapper", () => ({
  getFriendlyAuthErrorMessage: () => "Mock Firebase Error",
}));

jest.mock("react-native-flash-message", () => ({
  showMessage: jest.fn(),
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
    jest.clearAllMocks(); // clears call history
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

  it("clears error message when typing in email input", () => {
    const { getByText, getByTestId, queryByText } = renderScreen();

    fireEvent.press(getByText("Send link to email"));
    expect(getByText("Email is required")).toBeTruthy();

    fireEvent.changeText(getByTestId("email-input"), "test@example.com");
    expect(queryByText("Email is required")).toBeNull();
  });

  it("calls forgotPassword with correct email when 'Send link to email' is pressed", async () => {
    const { getByTestId, getByText } = renderScreen();

    const emailInput = getByTestId("email-input");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.press(getByText("Send link to email"));

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        auth,
        "test@example.com"
      );
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Check your email",
          description: expect.stringContaining("test@example.com"),
          type: "success",
        })
      );
    });
  });

  it("clicking on 'Back to login' button navigates to the login page", () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText("Back to login"));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("shows error flash message on Firebase error", async () => {
    const mockForgotPassword = jest.fn();
    const error = new FirebaseError("1", "Firebase error");
    mockForgotPassword.mockRejectedValueOnce(error);

    const { getByText, getByTestId } = render(
      <AuthContext.Provider
        value={{ user: null, forgotPassword: mockForgotPassword }}
      >
        <ResetPassword />
      </AuthContext.Provider>
    );

    fireEvent.changeText(getByTestId("email-input"), "test@example.com");
    fireEvent.press(getByText("Send link to email"));

    await waitFor(() => {
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error",
          description: "Mock Firebase Error",
          type: "danger",
        })
      );
    });
  });

  it("shows fallback error on unexpected error", async () => {
    const mockForgotPassword = jest.fn();
    const error = new Error("Unexpected error");
    mockForgotPassword.mockRejectedValueOnce(error);

    const { getByText, getByTestId } = render(
      <AuthContext.Provider
        value={{ user: null, forgotPassword: mockForgotPassword }}
      >
        <ResetPassword />
      </AuthContext.Provider>
    );

    fireEvent.changeText(getByTestId("email-input"), "test@example.com");
    fireEvent.press(getByText("Send link to email"));

    await waitFor(() => {
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unexpected Error",
          description: expect.stringContaining(
            "Something went wrong. Please try again"
          ),
          type: "danger",
        })
      );
    });
  });
});
