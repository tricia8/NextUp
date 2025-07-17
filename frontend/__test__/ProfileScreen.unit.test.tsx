import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { AuthContext } from "@/context/AuthContext";
import ProfileScreen from "@/components/ProfileScreen";
import EditProfile from "@/components/editprofile";

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

  it("renders profile picture", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );
    await waitFor(() => {
      const pic = getByTestId("profile-pic");
      expect(pic).toBeTruthy();
    });
  });

  it("renders username", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );
    await waitFor(() => {
      const username = getByText("Test User");
      expect(username).toBeTruthy();
    });
  });

  it("renders bio", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );
    await waitFor(() => {
      const bio = getByText("hi");
      expect(bio).toBeTruthy();
    });
  });

  it("renders Edit Profile button when viewing own profile", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );
    await waitFor(() => {
      const editButton = getByTestId("edit-button");
      expect(editButton).toBeTruthy();
    });
  });

  it("does not show Edit Profile button when viewing another user's profile", async () => {
    const otherUserUid = "other-user-uid";

    const { queryByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen uid={otherUserUid} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("edit-button")).toBeNull();
    });
  });

  const mockSetUserData = jest.fn();
  const mockSetCategory = jest.fn();
  const mockOnClose = jest.fn();

  it("closes modal when background is pressed", () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <EditProfile
          visible={true}
          onClose={mockOnClose}
          userData={mockUser}
          setUserData={mockSetUserData}
          setCategory={mockSetCategory}
          testID="edit-modal"
        />
      </AuthContext.Provider>
    );

    fireEvent(getByTestId("edit-modal"), "backdropPress");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders all UI elements correctly on Edit Profile modal", () => {
    const { getByText, getByDisplayValue, getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <EditProfile
          visible={true}
          onClose={mockOnClose}
          userData={mockUser}
          setUserData={mockSetUserData}
          setCategory={mockSetCategory}
          testID="edit-modal"
        />
      </AuthContext.Provider>
    );

    expect(getByTestId("profile-pic")).toBeTruthy();
    expect(getByText("Test User")).toBeTruthy();
    expect(getByDisplayValue("hi")).toBeTruthy();
    expect(getByTestId("save-button")).toBeTruthy();
  });

  it("calls update handlers correctly when Save is pressed", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <EditProfile
          visible={true}
          onClose={mockOnClose}
          userData={mockUser}
          setUserData={mockSetUserData}
          setCategory={mockSetCategory}
          testID="edit-modal"
        />
      </AuthContext.Provider>
    );

    fireEvent.press(getByText("SAVE"));

    await waitFor(() => {
      expect(mockSetUserData).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: "hi",
          category: ["Travel"],
          photoUrl: "http://test-url",
          uid: "test-uid",
          username: "Test User",
        })
      );
      expect(mockSetCategory).toHaveBeenCalledWith(expect.any(String));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("renders user stats and favourite category", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText(/5 GOALS ADDED/));
      expect(getByText(/3 GOALS COMPLETED/));
      expect(getByText(/Travel FAV CATEGORY/));
    });
  });

  it("renders View Friends button and navigates on press", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const button = getByText("View Friends");
      fireEvent.press(button);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "../friends",
        params: { viewedUid: "test-uid" },
      });
    });
  });

  it("renders Adds Friends button and navigates on press", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      const button = getByTestId("add-friends");
      fireEvent.press(button);
      expect(mockPush).toHaveBeenCalledWith("../addfriends");
    });
  });

  it("renders Journey preview and navigates on press", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <ProfileScreen />
      </AuthContext.Provider>
    );
    await waitFor(() => {
      const preview = getByTestId("preview");
      expect(preview).toBeTruthy();

      fireEvent.press(preview);

      expect(mockPush).toHaveBeenCalledWith({
        pathname: "../journey/[uid]",
        params: { uid: "test-uid" },
      });
    });
  });
});
