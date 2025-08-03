import React from "react";
import SublistSearchBar from "@/components/SublistSearchBar";
import { AuthContext } from "@/context/AuthContext";
import { Sublist } from "@/types/sublist";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ListRenderItemInfo, RenderTarget } from "@shopify/flash-list";

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
  loading: false,
};

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const React = require("react");

  return {
    useRouter: () => ({
      replace: mockReplace,
      push: mockPush,
    }),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
    /* useFocusEffect: (fn: any) => {
      React.useEffect(fn, []); // fn runs only after render, avoids infinite re-renders
    }, */
    useFocusEffect: jest.fn(),
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

const mockPresent = jest.fn();
jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    BottomSheetModalProvider: ({ children }: any) => <View>{children}</View>,
    BottomSheetModal: React.forwardRef((props: any, ref: any) => {
      if (ref) {
        ref.current = { present: mockPresent };
      }
      return (
        <View ref={ref} testID={props.testID}>
          {props.children}
        </View>
      );
    }),
    BottomSheetScrollView: ({ children, testID }: any) => (
      <View testID={testID}>{children}</View>
    ),
    BottomSheetBackdrop: (props: any) => <View testID={"mock-backdrop"} />,
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

import { useFocusEffect } from "expo-router";
import FilterPicker from "@/components/FilterPicker";
import SublistItems from "@/components/SublistItems";
import BucketList from "@/app/(main)/(tabs)/bucketlist";

const mockUseFocusEffect = useFocusEffect as jest.Mock;

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
  });

  it("filter icon opens filter modal on press", async () => {
    const { getByTestId, queryByTestId } = renderScreen();
    const filterIcon = getByTestId("filter-icon");
    fireEvent.press(filterIcon);
    await waitFor(() => {
      expect(mockPresent).toHaveBeenCalled();
      expect(queryByTestId("filter-modal")).toBeOnTheScreen();
    });
  });

  it("sublist search bar updates search results correctly on user input", async () => {
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

  it("show user feedback for empty bucketlist", async () => {
    act(() => {
      useSublistStore.setState({
        sublistData: {},
        sublistOrder: [],
      });
    });

    const { getByTestId } = renderScreen();

    await waitFor(() => expect(getByTestId("empty-list-text")).toBeTruthy());
  });

  it("shows LoadingScreen when user is being authenticated", () => {
    const mockAuthContext = {
      user: null,
      loading: true, // simulate auth in progress
    };

    const { getByTestId } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <BucketList />
      </AuthContext.Provider>
    );

    expect(getByTestId("loading-spinner")).toBeTruthy();
  });

  /* it("shows LoadingScreen when sublists are being fetched from database", () => {
    mockUseFocusEffect.mockImplementationOnce((fn: any) => {
      React.useEffect(fn, []);
    });

    act(() => {
      useSublistStore.setState({
        sublistData: {},
        sublistOrder: [],
      });
    });

    const { getByTestId } = render(
      <AuthContext.Provider value={contextValue}>
        <BucketList />
      </AuthContext.Provider>
    );
    expect(getByTestId("loading-spinner")).toBeTruthy();
  }); */

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

  describe("FilterModal", () => {
    const mockSetFilterOptions = jest.fn();
    const mockSetFilteredSublists = jest.fn();
    const mockSetSearchResults = jest.fn();
    const mockCloseSheet = jest.fn();

    const defaultFilterPickerProps = {
      sublistData: mockSublists,
      closeSheet: mockCloseSheet,
      setFilteredSublists: mockSetFilteredSublists,
      filterOptions: {
        owned: undefined,
        shared: undefined,
        visibility: undefined,
        progressStatus: undefined,
      },
      setFilterOptions: mockSetFilterOptions,
      setSearchResults: mockSetSearchResults,
    };

    const renderFilterPicker = () =>
      render(<FilterPicker {...defaultFilterPickerProps} />);

    // Mock a prevState for testing calls to setFilterOptions
    const prevState = {
      owned: true,
      shared: true,
      visibility: "friends",
      progressStatus: "Completed",
    };

    it("renders all key filter sections", () => {
      const { getByText } = renderFilterPicker();

      expect(getByText("Filter Options")).toBeTruthy();
      expect(getByText("Who owns it")).toBeTruthy();
      expect(getByText("Sharing status")).toBeTruthy();
      expect(getByText("Who can see it")).toBeTruthy();
      expect(getByText("Progress status")).toBeTruthy();
    });

    it("calls setFilterOptions with all undefined values when 'Reset All' is pressed", () => {
      const { getByText } = renderFilterPicker();

      fireEvent.press(getByText("Reset All"));
      expect(mockSetFilterOptions).toHaveBeenCalledWith({
        owned: undefined,
        shared: undefined,
        visibility: undefined,
        progressStatus: undefined,
      });
    });

    it("calls closeSheet when Cancel is pressed", () => {
      const { getByText } = renderFilterPicker();

      fireEvent.press(getByText("Cancel"));
      expect(mockCloseSheet).toHaveBeenCalled();
    });

    describe("Owned filter", () => {
      it("sets owned to true when 'Me' is pressed", () => {
        const { getByText } = renderFilterPicker();

        fireEvent.press(getByText("Me"));
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: true,
          shared: true,
          visibility: "friends",
          progressStatus: "Completed",
        });
      });

      it("resets owned filter when 'Clear' under 'Who owns it' is pressed", () => {
        const { getAllByText } = renderFilterPicker();
        fireEvent.press(getAllByText("Clear")[0]); // first 'Clear' is for 'Who owns it'
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: undefined,
          shared: true,
          visibility: "friends",
          progressStatus: "Completed",
        });
      });
    });

    describe("Shared filter", () => {
      it("updates shared to false when 'Not Shared' chip is pressed", () => {
        const { getByText } = renderFilterPicker();
        fireEvent.press(getByText("Not Shared"));
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: true,
          shared: false,
          visibility: "friends",
          progressStatus: "Completed",
        });
      });

      it("resets shared filter when 'Clear' under 'Sharing status' is pressed", () => {
        const { getAllByText } = renderFilterPicker();
        fireEvent.press(getAllByText("Clear")[1]); // second 'Clear' is for 'Sharing status'
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: true,
          shared: undefined,
          visibility: "friends",
          progressStatus: "Completed",
        });
      });
    });

    describe("Visibility filter", () => {
      it("updates visibility to private when 'Only Me' chip is pressed", () => {
        const { getByText } = renderFilterPicker();
        fireEvent.press(getByText("Only Me"));
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: true,
          shared: true,
          visibility: "private",
          progressStatus: "Completed",
        });
      });

      it("resets visibility filter when 'Clear' under 'Who can see it' is pressed", () => {
        const { getAllByText } = renderFilterPicker();
        fireEvent.press(getAllByText("Clear")[2]); // third 'Clear' is for 'Who can see it'
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: true,
          shared: true,
          visibility: undefined,
          progressStatus: "Completed",
        });
      });
    });

    describe("Progress filter", () => {
      it("updates progress status to In Progress when 'In Progress' chip is pressed", () => {
        const { getByText } = renderFilterPicker();
        fireEvent.press(getByText("In Progress"));
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: true,
          shared: true,
          visibility: "friends",
          progressStatus: "In Progress",
        });
      });

      it("resets progress filter when 'Clear' under 'Progress Status' is pressed", () => {
        const { getAllByText } = renderFilterPicker();
        fireEvent.press(getAllByText("Clear")[3]); // fourth 'Clear' is for 'Progress Status'
        expect(mockSetFilterOptions).toHaveBeenCalledWith(expect.any(Function));

        // Access the function passed to setFilterOptions
        const passedFunction = mockSetFilterOptions.mock.calls[0][0];

        // Run the passed function manually
        const newState = passedFunction(prevState);
        expect(newState).toEqual({
          owned: true,
          shared: true,
          visibility: "friends",
          progressStatus: undefined,
        });
      });
    });
  });

  describe("SublistItems", () => {
    it("renders sublist items with correct content", () => {
      const { getByTestId, queryByTestId } = render(
        <SublistItems
          uid={mockUser.uid}
          data={mockSublists.slice(0, 2)} // get the first 2 sublist items
          colorScheme="dark"
        />
      );

      const item1 = getByTestId("sublist-item-1");
      const [completed1, total1] = mockSublists[0].completionStatus || [0, 0];
      const item2 = getByTestId("sublist-item-2");
      const [completed2, total2] = mockSublists[1].completionStatus || [0, 0];

      expect(item1).not.toContainElement(queryByTestId(`shared-1`));
      expect(item1).toHaveTextContent(new RegExp(mockSublists[0].title));
      // expect(item1).toContain(expect.stringContaining(mockSublists[0].title));
      expect(item1).toHaveTextContent(
        mockSublists[0].accessLevel === "private"
          ? /only you/
          : mockSublists[0].accessLevel
      );

      expect(item1).toHaveTextContent(
        new RegExp(`${completed1}\\s*of\\s*${total1}\\s*complete`, "i") // \\s* matches whitespace, "i" flag makes it case-insensitive
      );

      expect(item2).toHaveTextContent(new RegExp(mockSublists[1].title));
      expect(item2).toContainElement(getByTestId("shared-2"));
      expect(item2).toHaveTextContent(
        mockSublists[1].accessLevel === "private"
          ? /only you/
          : new RegExp(mockSublists[1].accessLevel)
      );
      expect(item2).toHaveTextContent(
        new RegExp(`${completed2}\\s*of\\s*${total2}\\s*complete`, "i")
      );
    });

    it("navigates to Sublist Details screen on tapping a sublist item", () => {
      const { getByTestId, queryByTestId } = render(
        <SublistItems
          uid={mockUser.uid}
          data={mockSublists.slice(0, 1)} // get the first sublist item
          colorScheme="dark"
        />
      );

      const item1 = getByTestId("sublist-item-1");
      fireEvent.press(item1);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/(main)/[sublistId]",
        params: { sublistId: "1" },
      });
    });
  });
});
