import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { s, ms, vs } from "react-native-size-matters";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { auth } from "@/firebase/firebaseConfig";
import JourneyScreen from "@/app/(main)/(tabs)/journey";
import EditProfile from "@/components/editprofile";
import { User } from "@/types/user";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import LoadingScreen from "@/components/Loading";
import {
  deleteFriend,
  getRelationship,
  getUserProfile,
  getUserStats,
} from "@/firebase/firestore";
import ProfilePic from "./ProfilePic";
import { debouncePress } from "@/utils/debouncePress";

const PROFILEPICSIZE = ms(80);

type ProfileProps = {
  uid?: string;
};

export default function ProfileScreen({ uid }: ProfileProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [completedEvents, setCompletedEvents] = useState<number>(0);
  const [category, setCategory] = useState<string>("--");
  const [isFriend, setIsFriend] = useState<boolean>(false);

  const finalUid = uid ?? auth.currentUser?.uid;

  useFocusEffect(
    useCallback(() => {
      if (!finalUid) return;

      const fetchUser = async () => {
        try {
          const user = await getUserProfile(finalUid);
          const relationship = await getRelationship(
            auth.currentUser?.uid,
            finalUid
          );

          if (user) {
            setUserData(user);
            setCategory(user.category?.[0] ?? "--");
          }
          if (relationship === "friend") {
            setIsFriend(true);
          }
        } catch (error) {
          console.error("Failed to fetch user profile", error);
        }
      };

      fetchUser();
    }, [finalUid])
  );

  useFocusEffect(
    useCallback(() => {
      if (!finalUid) return;

      const fetchStats = async () => {
        try {
          const stats = await getUserStats(finalUid);
          setTotalEvents(stats.totalEvents);
          setCompletedEvents(stats.completedEvents);
        } catch (error) {
          console.log("Error fetching user stats:", error);
        }
      };

      fetchStats();
    }, [finalUid])
  );

  const handleDelete = async () => {
    Alert.alert(
      "Remove friend",
      `Are you sure you want to unfriend ${userData?.username}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFriend(auth.currentUser?.uid, finalUid);
              setIsFriend(false);
              Alert.alert(
                "Friend removed",
                `${userData?.username} has been removed from your friends.`
              );
            } catch (error) {
              Alert.alert("Error removing friend");
            }
          },
        },
      ]
    );
  };

  if (!userData || !finalUid) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.mainContainer}>
          <View style={styles.profileContainer}>
            <ProfilePic imageUrl={userData?.photoUrl} size={PROFILEPICSIZE} />

            <View style={styles.profileDetails}>
              <View style={styles.username}>
                <ThemedText
                  type="subtitle"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ maxWidth: s(120) }}
                >
                  {userData?.username}
                </ThemedText>

                {finalUid === auth.currentUser?.uid && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={debouncePress(() => {
                      setModalVisible(true);
                    })}
                  >
                    <Text style={styles.buttonText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View>
                <ThemedText
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={{ fontSize: RFValue(12), lineHeight: vs(20) }}
                >
                  {userData?.bio}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View>
              <ThemedText style={styles.dataText}>
                <ThemedText type="subtitle">{totalEvents}</ThemedText>
                {"\n"}
                <Text style={styles.subDataText}>GOALS{"\n"}ADDED</Text>
              </ThemedText>
            </View>

            <View>
              <ThemedText style={styles.dataText}>
                <ThemedText type="subtitle">{completedEvents}</ThemedText>
                {"\n"}
                <Text style={styles.subDataText}>GOALS{"\n"}COMPLETED</Text>
              </ThemedText>
            </View>

            <View>
              <ThemedText style={styles.dataText}>
                <ThemedText type="subtitle">{category}</ThemedText>
                {"\n"}
                <Text style={styles.subDataText}>FAV{"\n"}CATEGORY</Text>
              </ThemedText>
            </View>
          </View>

          <View style={styles.friendsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={debouncePress(() => {
                router.push({
                  pathname: "../friends",
                  params: { viewedUid: finalUid },
                });
              })}
            >
              <Ionicons name="people-outline" color="white" size={ms(18)} />
              <Text style={styles.buttonText}>View Friends</Text>
            </TouchableOpacity>

            {finalUid === auth.currentUser?.uid && (
              <TouchableOpacity
                style={styles.button}
                onPress={debouncePress(() => {
                  router.push("../addfriends");
                })}
              >
                <MaterialIcons name="group-add" color="white" size={ms(18)} />
              </TouchableOpacity>
            )}

            {isFriend && (
              <TouchableOpacity
                style={styles.button}
                onPress={debouncePress(() => {
                  handleDelete();
                })}
              >
                <MaterialIcons
                  name="person-remove"
                  color="white"
                  size={ms(18)}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.previewContainer}>
              <Preview
                route="journey"
                title="Journey"
                color="rgba(26, 230, 186, 0.5)"
                component={<JourneyScreen />}
                uid={finalUid}
              />
            </View>
          </View>
        </ThemedView>
      </ScrollView>

      {userData && (
        <EditProfile
          visible={isModalVisible}
          onClose={() => setModalVisible(false)}
          userData={userData}
          setUserData={setUserData}
          setCategory={setCategory}
        />
      )}
    </SafeAreaView>
  );
}

type Props = {
  route: string;
  title: string;
  color: string;
  component: React.ReactNode;
  uid: string;
};

function Preview({ route, title, color, component, uid }: Props) {
  return (
    <TouchableOpacity
      onPress={debouncePress(() => {
        router.push({
          pathname: "../journey/[uid]",
          params: { uid: uid },
        });
      })}
    >
      <View style={{ height: "100%", width: "100%" }}>
        <View style={{ padding: 15 }}>
          <ThemedText type="subtitle" style={{ textAlign: "center" }}>
            {title}
          </ThemedText>
        </View>
        {component}
      </View>
      <LinearGradient
        colors={["#00000000", color]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      ></LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(16),
  },
  profileContainer: {
    paddingHorizontal: s(22),
    paddingTop: vs(35),
    flexDirection: "row",
    gap: s(14),
    alignItems: "center",
  },
  profileDetails: {
    flex: 1,
    flexDirection: "column",
    gap: vs(8),
  },
  profilePic: {
    height: PROFILEPICSIZE,
    width: PROFILEPICSIZE,
    borderRadius: PROFILEPICSIZE / 2,
  },
  username: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: 10,
    backgroundColor: "#7b68ee",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
  },
  statsContainer: {
    paddingHorizontal: s(22),
    justifyContent: "space-around",
    flexDirection: "row",
  },
  dataText: {
    textAlign: "center",
    lineHeight: s(32),
  },
  subDataText: {
    fontSize: RFValue(12),
    lineHeight: s(20),
  },
  friendsContainer: {
    alignSelf: "center",
    flexDirection: "row",
    gap: s(8),
  },
  buttonText: {
    fontSize: RFValue(12),
    color: "white",
  },
  previewContainer: {
    //height: '50%',
    overflow: "hidden",
  },
});
