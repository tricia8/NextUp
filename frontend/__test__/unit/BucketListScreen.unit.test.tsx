import BucketList from "@/app/(main)/(tabs)/bucketlist";
import SublistSearchBar from "@/components/SublistSearchBar";
import { AuthContext } from "@/context/AuthContext";
import { Sublist } from "@/types/sublist";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ListRenderItemInfo, RenderTarget } from "@shopify/flash-list";
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

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    useRouter: () => ({
      replace: jest.fn,
    }),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
    useFocusEffect: (fn: any) => {
      React.useEffect(fn, []); // fn runs only after render, avoids infinite re-renders
    },
  };
});

jest.mock("@/firebase/firestore", () => ({
  __esModule: true, // if the module uses ES modules
  ...require("@/__mocks__/@/firebase/firestore"),
}));

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

/* const mockChildComponent = jest.fn();
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
}); */

const mockSublistItems = jest.fn();
jest.mock("@/components/SublistItems", () => {
  const Actual = jest.requireActual("@/components/SublistItems");
  return {
    __esModule: true,
    default: (props: any) => {
      mockSublistItems(props); // spy on props
      return <Actual.default {...props} />;
    },
  };
});

describe("BucketList", () => {
  const mockSublists: Sublist[] = [
    {
      id: "1",
      title: "Travel Goals",
      description: "",
      accessLevel: "private",
      collaborators: ["test-uid"],
      updatedAt: "",
      createdAt: "",
      updatedAtRaw: { _seconds: 1556530679, _nanoseconds: 6700000000 },
      createdAtRaw: { _seconds: 1556530679, _nanoseconds: 6700000000 },
      completionStatus: [8, 8],
      ownerId: "test-uid",
    },
    {
      id: "2",
      title: "Shopping List",
      description: "",
      accessLevel: "friends",
      collaborators: ["uid-2", "test-uid"],
      completionStatus: [2, 5],
      ownerId: "uid-2",
      updatedAt: "",
      createdAt: "",
      updatedAtRaw: { _seconds: 1557839461, _nanoseconds: 6700000000 },
      createdAtRaw: { _seconds: 1556530679, _nanoseconds: 6700000000 },
    },
    {
      id: "3",
      title: "Coding Projects",
      description: "",
      accessLevel: "everyone",
      collaborators: ["test-uid"],
      updatedAt: "",
      createdAt: "",
      updatedAtRaw: { _seconds: 1564127930, _nanoseconds: 6700000001 },
      createdAtRaw: { _seconds: 1562734651, _nanoseconds: 6700000001 },
      completionStatus: [0, 5],
      ownerId: "test-uid",
    },
  ];

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

  it("sublist search bar updates search results correctly on user input", async () => {
    act(() => {
      useSublistStore.setState({
        sublistData: {
          "1": mockSublists[0],
          "2": mockSublists[1],
          "3": mockSublists[2],
        },
        sublistOrder: ["1", "2", "3"],
      });
    });

    const { getByPlaceholderText, queryByText } = renderScreen();

    const searchInput = getByPlaceholderText("Search sublists...");

    fireEvent.changeText(searchInput, "Travel");

    expect(mockSublistItems).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [mockSublists[0]],
      })
    );

    expect(queryByText("Travel Goals")).toBeTruthy();
    expect(queryByText("Shopping List")).toBeNull();
    expect(queryByText("Coding Projects")).toBeNull();
  });

  describe("SublistSearchBar", () => {
    it("search bar updates search state and search results correctly on user input", async () => {
      const setSearchResults = jest.fn((value) => {});
      const { getByPlaceholderText } = render(
        <AuthContext.Provider value={contextValue}>
          <SublistSearchBar
            sublists={mockSublists}
            filteredSublists={mockSublists}
            setSearchResults={setSearchResults}
          />
        </AuthContext.Provider>
      );

      const searchInput = getByPlaceholderText("Search sublists...");

      fireEvent.changeText(searchInput, "Travel");
      expect(searchInput.props.value).toBe("Travel");
      expect(setSearchResults).toHaveBeenCalledWith([mockSublists[0]]);
    });
  });

  /* describe("SublistItems", () => {
    it("renders items", () => {
      const { getByText } = render(<SublistItems />);
      const element = getByText("Title of one of the items");
      // Do something with element ...
    });
  }); */
});
