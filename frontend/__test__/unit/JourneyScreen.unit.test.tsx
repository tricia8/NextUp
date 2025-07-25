import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import JourneyScreen from "@/components/JourneyScreen";
import { AuthContext } from "@/context/AuthContext";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

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
  useLocalSearchParams: () => ({ uid: "test-uid" }),
}));

jest.mock("@/firebase/firestore", () => {
  return {
    getRelationship: jest.fn(() => Promise.resolve("self")),
    getFilteredSubBucketLists: jest.fn(() =>
      Promise.resolve([{ id: "1", title: "Sublist 1" }])
    ),
    getAllEvents: jest.fn(() =>
      Promise.resolve([
        { id: "1", title: "Event 1" },
        { id: "2", title: "Event 2" },
      ])
    ),
  };
});

describe("JourneyScreen", () => {
  const mockUser = { uid: "test-user-id" };
  const contextValue = { user: mockUser };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders completed goals", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={contextValue}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="JourneyScreen" component={JourneyScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("Event 1")).toBeTruthy();
      expect(getByText("Event 2")).toBeTruthy();
    });
  });
});
