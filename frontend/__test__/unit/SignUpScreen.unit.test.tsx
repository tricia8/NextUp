import React, { act, useContext } from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import { AuthContext, AuthProvider } from "@/context/AuthContext";
import { checkUniqueUsername, createUser } from "@/firebase/firestore";
import { FirebaseError } from "firebase/app";
import { sendEmailVerification } from "firebase/auth";

const mockUser = {
  uid: "test-uid",
  displayName: "Test User",
  photoUrl: "http://test-url",
};

const mockFirebaseUser = {
  uid: "test-uid",
  email: "text@example.com",
};

jest.useFakeTimers();

const mockRegister = jest.fn();

const contextValue = {
  user: null,
  register: mockRegister,
};

jest.mock("expo-font");
jest.mock("expo-asset");

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({
      user: {
        uid: "test-uid",
        emailVerified: false,
        getIdToken: jest.fn().mockResolvedValue("test-token"),
      },
    })
  ),
  sendEmailVerification: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  signOut: jest.fn(),
}));

jest.mock("@/firebase/firestore", () => ({
  createUser: jest.fn(),
  checkUniqueUsername: jest.fn(),
}));

jest.mock("react-native-flash-message", () => ({
  showMessage: jest.fn(),
}));

import { showMessage } from "react-native-flash-message";
import Signup from "@/app/(auth)/signup";

// Mock error mapper
jest.mock("@/utils/firebaseErrorMapper", () => ({
  getFriendlyAuthErrorMessage: () => "Mock Firebase Error",
}));

const fillSignupForm = (getByTestId: any) => {
  fireEvent.changeText(getByTestId("email-input"), "test@example.com");
  fireEvent.changeText(getByTestId("username-input"), "testuser");
  fireEvent.changeText(getByTestId("password-input"), "Pass123!");
};

describe("Signup", () => {
  const renderSignup = () =>
    render(
      <AuthContext.Provider value={contextValue}>
        <Signup />
      </AuthContext.Provider>
    );

  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks(); // clears call history and resets all mocks to initial implementation
  });

  it("updates email, username and password state on input change", () => {
    const { getByTestId } = renderSignup();
    const emailInput = getByTestId("email-input");
    const usernameInput = getByTestId("username-input");
    const passwordInput = getByTestId("password-input");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(passwordInput, "password123");

    expect(emailInput.props.value).toBe("test@example.com");
    expect(usernameInput.props.value).toBe("testuser");
    expect(passwordInput.props.value).toBe("password123");
  });

  it("dismisses keyboard when 'Create account' is pressed", () => {
    const dismissSpy = jest.spyOn(Keyboard, "dismiss");
    const { getByTestId } = renderSignup();

    fillSignupForm(getByTestId);
    fireEvent.press(getByTestId("signup-button"));

    expect(dismissSpy).toHaveBeenCalled();
  });

  it("calls register and createUser with the correct credentials when 'Create account' is pressed and user inputs are valid", async () => {
    const idToken = "test-token";
    mockRegister.mockResolvedValueOnce({
      user: mockFirebaseUser,
      token: idToken,
    }); // mock return of register

    const { getByTestId } = renderSignup();

    fillSignupForm(getByTestId);
    fireEvent.press(getByTestId("signup-button"));

    await waitFor(() => {
      expect(contextValue.register).toHaveBeenCalledWith(
        "test@example.com",
        "Pass123!"
      );
      expect(createUser).toHaveBeenCalledWith(
        mockFirebaseUser,
        "testuser",
        idToken
      );
    });
  });

  it("'Create account' button disppears on click", () => {
    const { getByTestId, queryByTestId } = renderSignup();

    fillSignupForm(getByTestId);
    fireEvent.press(getByTestId("signup-button"));

    expect(queryByTestId("signup-button")).toBeNull();
    expect(getByTestId("loading-icon")).toBeTruthy();
  });

  it("calls checkUniqueUsername when typing username", async () => {
    const { getByTestId } = renderSignup();

    const usernameInput = getByTestId("username-input");
    fireEvent.changeText(usernameInput, "newuser");

    expect(checkUniqueUsername).toHaveBeenCalledWith(
      "newuser",
      expect.any(Function)
    );
  });

  it("blocks signup when username is taken", async () => {
    const { getByText, getByTestId, findByTestId } = renderSignup();

    // Simulate username is not available
    (checkUniqueUsername as jest.Mock).mockImplementationOnce((_, cb) =>
      cb(false)
    );

    act(() => {
      fillSignupForm(getByTestId);
    });

    // Fast-forward debounce delay
    jest.runAllTimers();

    await waitFor(async () => {
      expect(checkUniqueUsername).toHaveBeenCalled();
      // check for UI that depends on usernameAvailable
      await findByTestId("inline-error-username-taken");
    });

    // const errorMessage = await findByTestId("inline-error-username-taken");
    // expect(errorMessage).toBeTruthy();

    fireEvent.press(getByText("Create account"));

    await waitFor(() => {
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Username Taken",
          description: expect.stringContaining(
            "Please choose a different username"
          ),
        })
      );
    });

    expect(mockPush).not.toHaveBeenCalledWith("/login"); // signup is not successful
  });

  it("clicking on 'Log in' button navigates to the login page", () => {
    const { getByText } = renderSignup();

    fireEvent.press(getByText("Log in"));
    expect(mockPush).toHaveBeenCalledWith("./login");
  });

  it("auto-hides password after 5 seconds", async () => {
    const { getByTestId, queryByTestId } = renderSignup();
    const eyeButton = getByTestId("show-password-icon");
    const passwordInput = getByTestId("password-input");

    expect(getByTestId("show-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(eyeButton);

    // Check that 'eye-off' icon is shown and input is visible
    await waitFor(() => {
      expect(getByTestId("hide-password-icon")).toBeTruthy();
      expect(passwordInput.props.secureTextEntry).toBe(false);
    });

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

  it("toggles password visibility manually on repeated taps", async () => {
    const { getByTestId } = renderSignup();
    const passwordInput = getByTestId("password-input");

    act(() => fireEvent.press(getByTestId("show-password-icon")));
    await waitFor(() => {
      expect(getByTestId("hide-password-icon")).toBeTruthy();
    });
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // simulate logic that lets user tap eye-off to hide again manually
    act(() => fireEvent.press(getByTestId("hide-password-icon")));
    expect(getByTestId("show-password-icon")).toBeTruthy();
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  test("shows error message on Firebase error", async () => {
    const error = new FirebaseError("1", "Firebase error");
    mockRegister.mockRejectedValueOnce(error);
    (checkUniqueUsername as jest.Mock).mockImplementationOnce((_, cb) =>
      cb(true)
    );

    const { getByText, getByTestId } = renderSignup();

    act(() => fillSignupForm(getByTestId));

    await waitFor(() => {
      expect(checkUniqueUsername).toHaveBeenCalled();
      expect(getByTestId("check-icon")).toBeTruthy();
    });

    fireEvent.press(getByText("Create account"));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Sign Up Failed",
          description: "Mock Firebase Error",
        })
      );
    });
  });

  it("show user-friendly email verification alert on successful signup", async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <Signup />
      </AuthProvider>
    );

    const logout = jest.fn();

    (checkUniqueUsername as jest.Mock).mockImplementationOnce((_, cb) =>
      cb(true)
    );
    // (sendEmailVerification as jest.Mock).mockResolvedValueOnce(true);

    act(() => fillSignupForm(getByTestId));

    await waitFor(() => {
      expect(getByTestId("check-icon")).toBeTruthy();
    });

    fireEvent.press(getByTestId("signup-button"));

    await waitFor(() => {
      expect(sendEmailVerification).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "test-uid",
        })
      );
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Verify Your Email",
          description: expect.stringContaining("test@example.com"),
        })
      );
    });
  });
});
