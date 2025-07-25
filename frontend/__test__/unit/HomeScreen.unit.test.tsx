import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import HomeScreen from "@/app/(main)/(tabs)/index";
import { AuthContext } from "@/context/AuthContext";
import { generateSuggestion } from "@/gemini/generateSuggestion";
import SideMenu from "@/components/SideMenu";
import Notifications from "@/components/Notifications";

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

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: jest.fn,
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
  it("renders greeting with username", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("Hello Test User!")).toBeTruthy();
    });
  });

  it("renders bell icon", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByTestId("ringing-bell")).toBeTruthy());
  });

  it("renders message correctly when there are no notifications", () => {
    const { getByText } = render(
      <Notifications
        visible={true}
        onClose={jest.fn()}
        items={[]}
        userId="user"
        setActivities={jest.fn()}
      />
    );

    expect(getByText("No notifications")).toBeTruthy();
  });

  it("renders profile picture with correct image url", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const profilePic = getByTestId("profile-pic");
      expect(profilePic.props.source.uri).toBe("http://test-url");
    });
  });

  const mockSetOpen = jest.fn();

  it("side menu is displayed correctly", async () => {
    const { getByText, getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <SideMenu open={true} setOpen={mockSetOpen} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("NextUp")).toBeTruthy();
      expect(getByTestId("logout-button")).toBeTruthy();
    });
  });

  it("closes the side menu when background is pressed", () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <SideMenu open={true} setOpen={mockSetOpen} />
      </AuthContext.Provider>
    );

    fireEvent.press(getByTestId("side-menu-overlay"));
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it("renders donut chart", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const donut = getByTestId("donut-chart");
      expect(donut).toBeTruthy();
    });
  });

  it("renders AnimatedTextInput", async () => {
    const { getAllByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const inputs = getAllByTestId("animated-text");
      expect(inputs.length).toBe(2);
    });
  });

  it("shows overdue container when there are overdue goals", async () => {
    const { getByTestId, getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId("overdue-container")).toBeTruthy();
      expect(getByText("You have 1 overdue goal(s).")).toBeTruthy();
    });
  });

  it("renders upcoming events correctly", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("Upcoming")).toBeTruthy();
      expect(getByText("Upcoming Goal 1")).toBeTruthy();
      expect(getByText("Due Tomorrow")).toBeTruthy();
    });
  });

  it("renders AI suggestion text", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const suggestionContainer = getByTestId("suggestion-container");
      expect(suggestionContainer).toBeTruthy();
      expect(suggestionContainer).toHaveTextContent(
        /Bucket List Inspiration 🪄Climb Mount Fuji/
      );
    });
  });

  it("falls back when AI suggestion fails", async () => {
    jest
      .mocked(generateSuggestion)
      .mockRejectedValueOnce(new Error("AI failed"));

    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <HomeScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(
        getByText("Oops, unable to generate a suggestion at the moment.")
      ).toBeTruthy();
    });
  });

  it("calls logout when logout button pressed", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <SideMenu open={true} setOpen={() => {}} />
      </AuthContext.Provider>
    );
    await waitFor(() => {
      fireEvent.press(getByTestId("logout-button"));
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
