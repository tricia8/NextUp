import React from "react";
import AuthLayout from "@/app/(auth)/_layout";
import { AuthContext } from "@/context/AuthContext";
import { render, waitFor } from "@testing-library/react-native";
import { useRootNavigationState } from "expo-router";

const mockUser = {
  uid: "test-uid",
  email: "test@example.com",
};

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  Stack: ({ children }: { children: React.ReactNode }) => <>{children}</>, // dummy wrapper that renders children

  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: jest.fn(),
  useRootNavigationState: jest.fn(),
}));

describe("AuthLayout", () => {
  // all tests will have a valid navigation state by default
  beforeEach(() => {
    jest.clearAllMocks();
    (useRootNavigationState as jest.Mock).mockReturnValue({ key: "test-key" });
  });

  it("redirects authenticated user with verified email only once to main", async () => {
    const authUser = {
      uid: mockUser.uid,
      email: "test@example.com",
      emailVerified: true,
    };
    const loginMock = jest.fn();

    const { rerender } = render(
      <AuthContext.Provider
        value={{ login: loginMock, user: authUser, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(main)/(tabs)");
    });

    jest.clearAllMocks();

    rerender(
      <AuthContext.Provider
        value={{ login: loginMock, user: authUser, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it("redirects authenticated user with unverified email only once to login screen", async () => {
    const authUser = {
      ...mockUser,
      emailVerified: false,
    };

    const loginMock = jest.fn();

    const { rerender } = render(
      <AuthContext.Provider
        value={{ login: loginMock, user: authUser, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });

    jest.clearAllMocks();

    rerender(
      <AuthContext.Provider
        value={{ login: loginMock, user: authUser, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it("redirects unauthenticated user only once to login", async () => {
    const loginMock = jest.fn();

    // first render
    const { rerender } = render(
      <AuthContext.Provider
        value={{ login: loginMock, user: null, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });

    jest.clearAllMocks();

    rerender(
      <AuthContext.Provider
        value={{ login: loginMock, user: null, loading: false }}
      >
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled(); // expo router is not called after one redirect
    });
  });

  it("does not redirect if loading is true", async () => {
    const user = { ...mockUser, emailVerified: true };

    render(
      <AuthContext.Provider value={{ user, loading: true }}>
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it("does not redirect if navigation state is not ready", async () => {
    const user = { ...mockUser, emailVerified: true };

    (useRootNavigationState as jest.Mock).mockReturnValueOnce(null);

    render(
      <AuthContext.Provider value={{ user: null, loading: false }}>
        <AuthLayout />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
