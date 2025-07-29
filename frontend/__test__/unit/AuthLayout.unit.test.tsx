import React from "react";
import AuthLayout from "@/app/(auth)/_layout";
import { AuthContext } from "@/context/AuthContext";
import { render, waitFor } from "@testing-library/react-native";

const mockUser = {
  uid: "test-uid",
  displayName: "Test User",
  photoUrl: "http://test-url",
};

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  Stack: ({ children }: { children: React.ReactNode }) => <>{children}</>, // dummy wrapper that renders children

  useRouter: () => ({
    replace: mockReplace,
  }),
  useRootNavigationState: () => ({
    key: "test-key",
  }),
}));

describe("AuthLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects authenticated user with verified email to main", async () => {
    const authUser = {
      uid: mockUser.uid,
      email: "test@example.com",
      emailVerified: true,
    };
    const loginMock = jest.fn();

    render(
      <AuthContext.Provider
        value={{ login: loginMock, user: authUser, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(main)/(tabs)");
    });
  });

  it("redirects authenticated user with unverified email to login screen", async () => {
    const authUser = {
      uid: mockUser.uid,
      email: "test@example.com",
      emailVerified: false,
    };

    const loginMock = jest.fn();

    render(
      <AuthContext.Provider
        value={{ login: loginMock, user: authUser, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  it("does nothing when user is not authenticated", async () => {
    const loginMock = jest.fn();

    render(
      <AuthContext.Provider
        value={{ login: loginMock, user: null, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled(); // expo router is not called
    });
  });
});
