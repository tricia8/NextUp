import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import Signup from "@/app/(auth)/signup";
import { createUser } from "@/firebase/firestore";

const mockUser = {
  uid: "test-uid",
  displayName: "Test User",
  photoUrl: "http://test-url",
};

const mockFirebaseUser = {
  uid: "test-uid",
  email: "text@example.com",
};

const mockRegister = jest.fn();

const contextValue = {
  user: null,
  register: mockRegister,
};

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("@/firebase/firestore", () => ({
  createUser: jest.fn(() => Promise.resolve(true)),
  checkUniqueUsername: jest.fn(),
}));

const fillSignupForm = (getByTestId: any) => {
  fireEvent.changeText(getByTestId("email-input"), "test@example.com");
  fireEvent.changeText(getByTestId("username-input"), "testuser");
  fireEvent.changeText(getByTestId("password-input"), "Pass123!");
};

describe("Signup", () => {
  // Clear mocks before each test
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("updates email, username and password state on input change", () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <Signup />
      </AuthContext.Provider>
    );
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
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <Signup />
      </AuthContext.Provider>
    );

    fillSignupForm(getByTestId);
    fireEvent.press(getByTestId("signup-button"));

    expect(dismissSpy).toHaveBeenCalled();
  });

  it("calls register and createUser with the correct credentials when 'Create account' is pressed and user inputs are valid", async () => {
    mockRegister.mockResolvedValueOnce(mockFirebaseUser); // mock return of register

    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <Signup />
      </AuthContext.Provider>
    );

    fillSignupForm(getByTestId);
    fireEvent.press(getByTestId("signup-button"));

    await waitFor(() => {
      expect(contextValue.register).toHaveBeenCalledWith(
        "test@example.com",
        "Pass123!"
      );
      expect(createUser).toHaveBeenCalledWith(mockFirebaseUser, "testuser");
    });
  });
});
