import React from "react";
import {
  render,
  waitFor,
  fireEvent,
  waitForElementToBeRemoved,
} from "@testing-library/react-native";
import { AuthContext } from "@/context/AuthContext";
import ProfileScreen from "@/components/ProfileScreen";

const mockUser = {
  uid: "test-uid",
  username: "Test User",
  photoUrl: "http://test-url",
  bio: "hi",
  category: ["Travel"],
};

const contextValue = {
  user: mockUser,
};

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: (fn: any) => fn(),
}));

jest.mock("@/firebase/firebaseConfig", () => ({
  auth: {
    currentUser: {
      uid: "test-uid",
    },
  },
}));

jest.mock("@/firebase/firestore", () => ({
  getUserProfile: jest.fn(() =>
    Promise.resolve({
      ...mockUser,
    })
  ),
  getUserStats: jest.fn(() =>
    Promise.resolve({ totalEvents: 5, completedEvents: 3 })
  ),
  getRelationship: jest.fn(() => Promise.resolve("self")),
  deleteFriend: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/components/JourneyScreen", () => {
  return () => {
    return <></>;
  };
});

jest.mock("@/utils/debouncePress", () => ({
  debouncePress: (fn: any) => fn,
}));

jest.mock("@/cloudinary/pickImage", () => ({
  pickImage: jest.fn(() => Promise.resolve("base64-mock")),
}));

jest.mock("@/cloudinary/upload", () => ({
  uploadToCloudinary: jest.fn(() => Promise.resolve("http://new-image-url")),
}));

describe("ProfileScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("opens Edit Profile modal, updates profile, and closes modal", async () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId("bio").props.children).toBe("hi");
      expect(queryByTestId("edit-modal")).toBeNull();
    });

    fireEvent.press(getByTestId("edit-button"));
    expect(getByTestId("edit-modal")).toBeTruthy();

    const bioInput = getByTestId("bio-input");
    fireEvent.changeText(bioInput, "enjoy");

    fireEvent.press(getByText("SAVE"));

    await waitForElementToBeRemoved(() => queryByTestId("edit-modal"));
  });
});
