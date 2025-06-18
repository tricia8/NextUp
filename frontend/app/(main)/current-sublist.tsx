import SublistField from "@/components/SublistField";
import { useLayoutEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import ShareListModal from "@/components/ShareListModal";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RFValue } from "react-native-responsive-fontsize";

interface User {
  username: string;
}

interface SublistFormProps {
  initialTitle?: string;
  initialDescription?: string;
  initialAccess?: string;
  users: User[];
  onSubmit: (title: string, description: string, access: string) => void;
}

export default function currentSublist({
  initialTitle = "Hello",
  initialDescription = "Dummy Desc",
  initialAccess = "",
  users,
  onSubmit,
}: SublistFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDesc] = useState(initialDescription);
  const [accessLevel, setAccessLevel] = useState(initialAccess);
  const [modalVisible, setModalVisible] = useState(false);

  // set right header as invite collaborators icon
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{ marginRight: 12 }}
        >
          <MaterialIcons name="group-add" size={30} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeView} edges={[]}>
      <ThemedView lightColor="#a2e6ff" style={styles.themedView}>
        <ShareListModal
          data={users}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
        {!isEditing && (
          <View style={{ gap: 8 }}>
            <View style={styles.titleEditBar}>
              <ThemedText
                type="title"
                style={{
                  flexShrink: 1, // shrink if needed so no overflowing occurs
                }}
              >
                {title}
              </ThemedText>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Feather name="edit-2" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <ThemedText type="defaultSemiBold" style={{ flexWrap: "wrap" }}>
              {description}
            </ThemedText>
          </View>
        )}

        {isEditing && (
          <View style={{ gap: 10 }}>
            <SublistField
              label="Title"
              onChangeText={(value) => setTitle(value)}
              value={title}
            />
            <SublistField
              label="Description"
              onChangeText={(value) => setDesc(value)}
              value={description}
              multiline={true}
            />
            <View style={styles.editHandler}>
              <TouchableOpacity
                style={[styles.editingButton, { backgroundColor: "#f4f1f0" }]}
                onPress={() => {
                  setTitle(initialTitle);
                  setDesc(initialDescription);
                  setIsEditing(false);
                }}
              >
                <Text style={{ color: "#618ce0" }}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editingButton, { backgroundColor: "#618ce0" }]}
                onPress={() => {
                  setIsEditing(false);
                }}
              >
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.addButton}>
          <Text style={{ fontSize: RFValue(13) }}>Add Goal</Text>
          <Ionicons name="add-circle-outline" size={22} color="black" />
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
  },
  themedView: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    paddingVertical: 13,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 15,
    backgroundColor: "#46d5c2",
    color: "#fff",
    flexDirection: "row",
    gap: 8,
  },
  titleEditBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  editingButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
  },
  editHandler: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
