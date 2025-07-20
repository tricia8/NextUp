import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";
import HomeScreen from "@/app/(main)/(tabs)/index";
import { AuthContext } from "@/context/AuthContext";

const mockLogout = jest.fn();

const mockUser = {
  uid: "test-uid",
  displayName: "Test User",
  photoUrl: "http://test-url",
};

const contextValue = {
  user: mockUser,
  logout: mockLogout,
};

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: (fn: any) => fn(),
}));

jest.mock("@/firebase/firestore", () => ({
  getUserProfile: jest.fn(() =>
    Promise.resolve({ displayName: "Test User", photoUrl: "http://test-url" })
  ),
  getUserStats: jest.fn(() =>
    Promise.resolve({ totalEvents: 5, completedEvents: 3 })
  ),
  getUpcomingEvents: jest.fn(() =>
    Promise.resolve([
      { id: "1", title: "Upcoming Goal 1", deadline: "Tomorrow" },
    ])
  ),
  getOverdueEvents: jest.fn(() => Promise.resolve([{ id: "1" }])),
  getFriendRequests: jest.fn(() =>
    Promise.resolve([
      {
        id: "1",
        senderId: "123",
        type: "friend",
        sentAt: { toMillis: () => Date.now() },
      },
    ])
  ),
  getSublistInvites: jest.fn(() => Promise.resolve([])),
}));

jest.mock("@/gemini/generateSuggestion", () => ({
  generateSuggestion: jest.fn(() =>
    Promise.resolve({ output: "Climb Mount Fuji" })
  ),
}));

describe("HomeScreen", () => {
  it("clicking on bell icon opens notifications modal", async () => {
    const { getByTestId, queryByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByTestId("ringing-bell")).toBeTruthy());
    expect(queryByTestId("notifications-modal")).toBeNull();

    fireEvent.press(getByTestId("ringing-bell"));

    await waitFor(() =>
      expect(getByTestId("notifications-modal")).toBeTruthy()
    );
  });

  it("logs out and redirects to login screen after clicking profile pic and logout", async () => {
    const { getByTestId, queryByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByTestId("profile-pic")).toBeTruthy());
    expect(queryByTestId("side-menu-overlay")).toBeNull();

    fireEvent.press(getByTestId("profile-pic"));
    await waitFor(() =>
      expect(getByTestId("side-menu-overlay")).toBeTruthy()
    );

    fireEvent.press(getByTestId("logout-button"));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });
  });
});
