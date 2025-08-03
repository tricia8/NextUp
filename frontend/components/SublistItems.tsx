import { Sublist } from "@/types/sublist";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ColorSchemeName,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
} from "react-native";
import { ThemedText } from "./ThemedText";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Chip } from "react-native-paper";
import { FlashList } from "@shopify/flash-list";
import { RFValue } from "react-native-responsive-fontsize";
import { ReactNode, useState } from "react";
import { deleteSubBucketList } from "@/firebase/firestore";
import { showMessage } from "react-native-flash-message";
import SwipeableRow from "./SwipeableRow";
import DeleteModal from "./DeleteModal";
import { useSublistStore } from "@/stores/sublistStore";
import { debouncePress } from "@/utils/debouncePress";

interface ItemProps {
  uid: string;
  data: Sublist[];
  toggleVersion?: () => void; // optional, used to trigger refetch of data
  colorScheme: ColorSchemeName;
}

export default function SublistItems({
  uid,
  data,
  colorScheme,
  toggleVersion = () => {},
}: ItemProps): ReactNode | Promise<ReactNode> {
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Sublist | null>(null);

  // Delete modal text
  const heading = "Are you sure you want to delete this sublist?";
  const body =
    "This will permanently delete all goals in this list, including completed ones. This action cannot be undone.";

  const handleSublistPress = (item: Sublist) => {
    router.push({
      pathname: "/(main)/[sublistId]",
      params: { sublistId: item.id },
    });
  };

  const accessColorMap: Record<string, { bg: string; text: string }> = {
    private: {
      bg: "rgba(231, 208, 242, 0.61)",
      text: "#4e4350",
    },
    friends: { bg: "rgba(159, 236, 250, 0.56)", text: "#11395d" },
    everyone: { bg: "rgba(181, 245, 220, 0.4)", text: "#0a5201" },
    default: { bg: "rgba(255, 255, 255, 0.5)", text: "#000" },
  };

  // delete sublist
  const { addSublist, removeSublist } = useSublistStore();
  const handleDelete = async (sublist: Sublist) => {
    try {
      console.log("deleting sublist");
      console.log("userid", uid);
      // Optimistic UI
      removeSublist(sublist.id);

      await deleteSubBucketList(sublist);
      console.log("deleted!");

      /* updateData((prevSublists) =>
        prevSublists.filter((list) => list.id !== sublist.id)
      ); */
      // toggleVersion?.();
      setModalVisible(false); // clsose modal after deletion
      showMessage({
        message: "Success",
        description: "Sublist deleted successfully",
        type: "success",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "success",
        duration: 5000,
      });
    } catch (error) {
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Error deleting sublist",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
        duration: 5000,
      });

      // Re-add to cache if deletion fails
      addSublist(sublist.id, sublist, sublist.ownerId);
    }
  };

  const renderFlatlistItem = ({ item }: { item: Sublist }) => {
    if (!item) return null; // handle case where item is undefined
    const access = accessColorMap[item.accessLevel?.toLowerCase() ?? "default"];

    return (
      <SwipeableRow
        onDelete={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
      >
        <LinearGradient
          colors={isDark ? ["#0f2027", "#188991"] : ["#dcf4a9", "#b2df75"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.itemContainer}
        >
          <TouchableOpacity
            testID={`sublist-item-${item.id}`}
            style={{ flex: 1 }}
            onPress={debouncePress(() => handleSublistPress(item))}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              {item?.collaborators?.length > 1 ? (
                <Feather
                  testID={`shared-${item.id}`}
                  name="users"
                  size={24}
                  color={isDark ? "white" : "black"}
                />
              ) : (
                <></>
              )}
              <Chip
                icon="eye"
                style={{
                  borderRadius: 15,
                  backgroundColor: access.bg,
                }}
                compact={true}
                textStyle={{
                  fontSize: RFValue(10),
                  color: access.text,
                }}
              >
                {item.accessLevel
                  ? item.accessLevel === "private"
                    ? "only you"
                    : item.accessLevel
                  : "unknown"}
              </Chip>
            </View>

            <View style={styles.subListRow2}>
              <ThemedText type="subtitle" style={styles.listName}>
                {item.title}
              </ThemedText>

              <AntDesign
                name="right"
                size={20}
                color="black"
                style={{ marginTop: 6 }}
              />
            </View>
            <View>
              <ThemedText style={styles.statusText}>
                {item.completionStatus[0]} of {item.completionStatus[1]}{" "}
                complete
              </ThemedText>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </SwipeableRow>
    );
  };

  return (
    <>
      <FlashList
        data={data}
        renderItem={renderFlatlistItem}
        estimatedItemSize={20}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        extraData={colorScheme}
      />
      {modalVisible && (
        <View
          style={{
            zIndex: 1000,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <DeleteModal
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            item={selectedItem}
            handleItemDelete={(item) => {
              // type check to ensure item is a Sublist
              if (item && "accessLevel" in item) {
                handleDelete(item);
              }
            }}
            heading={heading}
            body={body}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "column",
    marginVertical: 8,
    marginHorizontal: 15,
    padding: 20,
    justifyContent: "space-between",
    borderRadius: 5,
    elevation: 5,
  },
  subListRow2: {
    flexDirection: "row",
    padding: 2,
    justifyContent: "space-between",
  },
  listName: {
    fontSize: RFValue(16),
  },
  statusText: {
    fontSize: RFValue(11),
  },
});
