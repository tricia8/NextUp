import BucketList from "@/app/(main)/(tabs)/bucketlist";
import { AuthContext } from "@/context/AuthContext";
import { Sublist } from "@/types/sublist";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ListRenderItem,
  ListRenderItemInfo,
  RenderTarget,
} from "@shopify/flash-list";
import { ColorSchemeName } from "react-native";

import { useSublistStore } from "@/stores/sublistStore";
// import { XMLHttpRequest } from "xmlhttprequest";
// global.XMLHttpRequest = XMLHttpRequest;

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
  __esModule: true, // if the module uses ES modules
  ...require("@/__mocks__/@/firebase/firestore"),
}));

const { mockSublists } = require("@/__mocks__/@/firebase/firestore"); // loads after mock is applied

jest.mock("firebase/firestore", () => {
  return {
    __esModule: true, // if the module uses ES modules
    getFirestore: jest.fn(() => ({})),
    onSnapshot: jest.fn(() => () => {}),
  };
});

type FlashListType = {
  data: Sublist[];
  renderItem: (info: ListRenderItemInfo<Sublist>) => React.ReactElement | null;
  keyExtractor?: ((item: Sublist, index: number) => string) | undefined;
};

jest.mock("@shopify/flash-list", () => {
  /* return {
    FlashList: ({ data, renderItem }: FlashListType) => (
      <>{data.map((item, index) => renderItem({ item, index }))}</>
    ),
  }; */
  const { ScrollView, View } = require("react-native");

  return {
    FlashList: ({ data, renderItem, keyExtractor }: FlashListType) => (
      <ScrollView>
        {data.map((item, index) => (
          <View key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem({
              item,
              index,
              target: {} as RenderTarget,
              separators: {},
            } as ListRenderItemInfo<Sublist>)}
          </View>
        ))}
      </ScrollView>
    ),
  };
});

const mockChildComponent = jest.fn();
interface ItemProps {
  uid: string;
  data: Sublist[];
  toggleVersion?: () => void; // optional, used to trigger refetch of data
  colorScheme: ColorSchemeName;
}

// Mock the child component file, and grab all props passed to it
// and pass them to the Jest mock function so it can listen.
jest.mock("@/components/SublistItems", () => (props: ItemProps) => {
  mockChildComponent(props);
  return <></>; // mocked SublistItems component
});

describe("BucketList", () => {
  const renderScreen = () =>
    render(
      <AuthContext.Provider value={contextValue}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <BucketList />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </AuthContext.Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks(); // clears call history
  });

  it("search bar updates search correctly on user input", async () => {
    const { getByPlaceholderText } = renderScreen();

    const searchInput = getByPlaceholderText("Search sublists...");

    fireEvent.changeText(searchInput, "Travel");

    expect(searchInput.props.value).toBe("Travel");
  });

  it("search bar updates search results correctly on user input", () => {
    // const setFilteredSublists = jest.fn((value) => {});
    // const { mockSublists } = require("@/__mocks__/@/firebase/firestore");
    // console.log("Mock sublists: ", mockSublists);
    // inject mock data into zustand store
    /* act(() => {
      useSublistStore.setState({
        sublistData: {
          "1": mockSublists[0],
          "2": mockSublists[1],
          "3": mockSublists[2],
        },
        sublistOrder: ["1", "2", "3"],
      });
    }); */
    /* await waitFor(() => {
      expect(searchInput.props.value).toBe("Travel");
      expect(setFilteredSublists).toHaveBeenCalledWith("Travel");
      expect(mockChildComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [mockSublists[0]],
        })
      );
    }); */
    /* await waitFor(() => {
      expect(queryByText("Travel Goals")).toBeTruthy();
      expect(queryByText("Shopping List")).toBeNull();
      expect(queryByText("Coding Projects")).toBeNull();
    }); */
  });

  /* describe("SublistItems", () => {
    it("renders items", () => {
      const { getByText } = render(<SublistItems />);
      const element = getByText("Title of one of the items");
      // Do something with element ...
    });
  }); */
});
