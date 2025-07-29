import React from "react";
import { act } from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Login from "@/app/(auth)/login";
import { Keyboard } from "react-native";
import { AuthContext } from "@/context/AuthContext";

const mockUser = {
  uid: "test-uid",
  displayName: "Test User",
  photoUrl: "http://test-url",
};

const contextValue = {
  user: null,
};

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.useFakeTimers();

describe("Login", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("updates email and password state on input change", () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );
    const emailInput = getByTestId("email-input");
    const passwordInput = getByTestId("password-input");

    fireEvent.changeText(emailInput, "text@example.com");
    fireEvent.changeText(passwordInput, "Pass123!");

    expect(emailInput.props.value).toBe("text@example.com");
    expect(passwordInput.props.value).toBe("Pass123!");
  });

  it("shows validation errors when email and password are empty", () => {
    const { getByTestId, getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );
    fireEvent.press(getByTestId("login-button"));

    expect(getByText("Email is required")).toBeTruthy();
    expect(getByText("Password is required")).toBeTruthy();
  });

  it("clears email error when user types", () => {
    const { getByTestId, getByText, queryByText } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );
    fireEvent.press(getByTestId("login-button"));
    expect(getByText("Email is required")).toBeTruthy();

    fireEvent.changeText(getByTestId("email-input"), "test@example.com");
    expect(queryByText("Email is required")).toBeNull(); // error cleared

    fireEvent.changeText(getByTestId("password-input"), "Pass123!");
    expect(queryByText("Password is required")).toBeNull(); // error cleared
  });

  it("auto-hides password after 5 seconds", () => {
    const { getByTestId, queryByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );
    const eyeButton = getByTestId("show-password-icon");
    const passwordInput = getByTestId("password-input");

    expect(getByTestId("show-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(eyeButton);

    // Check that 'eye-off' icon is shown and input is visible
    expect(getByTestId("hide-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // Advance time by 3 seconds, 'eye-off'should still be visible
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(getByTestId("hide-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(false);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(queryByTestId("hide-password-icon")).toBeNull();
    expect(getByTestId("show-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(true); // password input should be hidden again
  });

  it("toggles password visibility manually on repeated taps", () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );
    const passwordInput = getByTestId("password-input");

    fireEvent.press(getByTestId("show-password-icon"));
    expect(getByTestId("hide-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // simulate logic that lets user tap eye-off to hide again manually
    fireEvent.press(getByTestId("hide-password-icon"));
    expect(getByTestId("show-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it("dismisses keyboard when 'Log in' is pressed", () => {
    const dismissSpy = jest.spyOn(Keyboard, "dismiss");
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );

    fireEvent.changeText(getByTestId("email-input"), "test@example.com");
    fireEvent.changeText(getByTestId("password-input"), "Pass123!");
    fireEvent.press(getByTestId("login-button"));

    expect(dismissSpy).toHaveBeenCalled();
  });

  it("navigates to signup screen on sign up button press", () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );
    fireEvent.press(getByText("Sign up"));

    expect(mockPush).toHaveBeenCalledWith("./signup");
  });

  it("navigates to forgot-password screen on reset-password button press", () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>
    );
    fireEvent.press(getByText("Reset password"));

    expect(mockPush).toHaveBeenCalledWith("./forgot-password");
  });

  it("calls login with correct email and password when both fields are filled on login press", () => {
    const loginMock = jest.fn(() => Promise.resolve(mockUser));
    const { getByTestId } = render(
      <AuthContext.Provider value={{ login: loginMock }}>
        <Login />
      </AuthContext.Provider>
    );

    fireEvent.changeText(getByTestId("email-input"), "test@example.com");
    fireEvent.changeText(getByTestId("password-input"), "Pass123!");
    fireEvent.press(getByTestId("login-button"));

    expect(loginMock).toHaveBeenCalledWith("test@example.com", "Pass123!");
  });

  it("should not call login if fields are empty", () => {
    const loginMock = jest.fn();
    const { getByTestId } = render(
      <AuthContext.Provider value={{ login: loginMock }}>
        <Login />
      </AuthContext.Provider>
    );

    fireEvent.press(getByTestId("login-button"));
    expect(loginMock).not.toHaveBeenCalled();
  });
});
