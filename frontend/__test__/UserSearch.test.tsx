import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { AuthContext } from "@/context/AuthContext";
import UserSearch from "@/components/UserSearch";
import { Timestamp } from "firebase/firestore";

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
  getFriendRequests: jest.fn(() =>
    Promise.resolve([
      {
        id: "1",
        senderId: "123",
        type: "friend",
      },
    ])
  ),
}));

describe("UserSearch", () => {
  it("renders search bar", async () => {
    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <UserSearch users={[]} friendUids={[]} sentRequests={[]} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId("search-bar")).toBeTruthy();
    });
  });

  it("renders users list", async () => {
    const users = [{ uid: "1", username: "User1", photoUrl: null }];

    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <UserSearch users={users} friendUids={[]} sentRequests={[]} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("User1")).toBeTruthy();
    });
  });

  it("filters users list by search input", async () => {
    const users = [
      { uid: "1", username: "User1", photoUrl: null },
      { uid: "2", username: "User2", photoUrl: null },
    ];
    const { getByPlaceholderText, queryByText } = render(
      <UserSearch
        users={users}
        friendUids={[]}
        sentRequests={[]}
        placeholder="Search users"
      />
    );

    const input = getByPlaceholderText("Search users");
    fireEvent.changeText(input, "user2");

    expect(queryByText("User1")).toBeNull();
    expect(queryByText("User2")).toBeTruthy();
  });

  it("shows 'Requested' if friend request is pending", () => {
    const users = [{ uid: "2", username: "User2", photoUrl: null }];
    const sentRequests = [
      {
        id: "1",
        senderId: "1",
        senderName: "User1",
        receiverId: "2",
        receiverName: "User2",
        sentAt: Timestamp.now(),
      },
    ];

    const { getByText } = render(
      <UserSearch
        users={users}
        friendUids={[]}
        sentRequests={sentRequests}
        userId="1"
        showAddButton={true}
      />
    );

    expect(getByText("Requested")).toBeTruthy();
  });

  it("shows add friend button if user is neither account user nor friend", () => {
    const users = [{ uid: "2", username: "User2", photoUrl: null }];

    const { getByTestId } = render(
      <UserSearch
        users={users}
        friendUids={[]}
        sentRequests={[]}
        userId="1"
        showAddButton={true}
      />
    );
    expect(getByTestId("add-friend")).toBeTruthy();
  });

  it("does not show add friend button if user is account user or friend", () => {
    const users = [{ uid: "2", username: "User2", photoUrl: null }];

    const { queryByTestId } = render(
      <UserSearch
        users={users}
        friendUids={["2"]}
        sentRequests={[]}
        userId="1"
        showAddButton={true}
      />
    );
    expect(queryByTestId("add-friend")).toBeNull();
  });

  it("clicking on add friend button calls handleAddFriend", () => {
    const mockHandleAdd = jest.fn();
    const users = [{ uid: "2", username: "User2", photoUrl: null }];

    const { getByTestId } = render(
      <UserSearch
        users={users}
        friendUids={[]}
        sentRequests={[]}
        userId="1"
        showAddButton={true}
        handleAddFriend={mockHandleAdd}
      />
    );
    fireEvent.press(getByTestId("add-friend"));
    expect(mockHandleAdd).toHaveBeenCalledWith("2");
  });
});
