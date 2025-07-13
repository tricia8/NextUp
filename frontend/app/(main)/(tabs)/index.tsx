import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { s, ms, vs } from "react-native-size-matters";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import DonutChart from "@/components/AnimatedDonutChart";
import AnimatedTextInput from "@/components/AnimatedTextInput";
import SideMenu from "@/components/SideMenu";
import { useCallback, useContext, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { Event } from "@/types/event";
import LoadingScreen from "@/components/Loading";
import {
  getUserStats,
  getUpcomingEvents,
  getOverdueEvents,
  getUserProfile,
  getFriendRequests,
  getSublistInvites,
} from "@/firebase/firestore";
import ProfilePic from "@/components/ProfilePic";
import { debouncePress } from "@/utils/debouncePress";
import RingingBell from "@/components/AnimatedBell";
import Notifications from "@/components/Notifications";
import { Activity } from "@/types/activity";
import { generateSuggestion } from "@/gemini/generateSuggestion";
import Markdown from "react-native-markdown-display";

const PROFILEPICSIZE = ms(50);

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const uid = user?.uid;
  const [name, setName] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [completedEvents, setCompletedEvents] = useState<number | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[] | null>(null);
  const [overdueCount, setOverdueCount] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string>("");

  const toggleOpen = () => {
    setOpen(!open);
  };

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;

      const fetchUserData = async () => {
        try {
          const user = await getUserProfile(uid);
          setName(user?.displayName);
          setPhotoUrl(user?.photoUrl);

          const stats = await getUserStats(uid);
          setTotalEvents(stats.totalEvents);
          setCompletedEvents(stats.completedEvents);

          const [friendRequests, listInvites] = await Promise.all([
            getFriendRequests(uid),
            getSublistInvites(),
          ]);

          const friendRequestsWithType = friendRequests.map(
            (req: Activity) => ({
              ...req,
              type: "friend",
            })
          );

          const listInvitesWithType = listInvites.map((invite: Activity) => ({
            ...invite,
            type: "sublist",
          }));

          const allActivities = [
            ...friendRequestsWithType,
            ...listInvitesWithType,
          ];
          allActivities.sort((a, b) => {
            const aTime = a.sentAt?.toMillis?.() ?? 0;
            const bTime = b.sentAt?.toMillis?.() ?? 0;
            return bTime - aTime; // Most recent first
          });

          setActivities(allActivities);
        } catch (error) {
          console.error("Error fetching user data and stats:", error);
        }
      };

      fetchUserData();
    }, [uid])
  );

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;

      const fetchData = async () => {
        const now = new Date();

        try {
          const upcoming = await getUpcomingEvents(uid, now);
          const overdue = await getOverdueEvents(uid, now);
          setUpcomingEvents(upcoming);
          setOverdueCount(overdue.length);
        } catch (error) {
          console.log("Error fetching upcoming and overdue events:", error);
        }
      };

      fetchData();
    }, [uid])
  );

  useEffect(() => {
    const getSuggestion = async () => {
      try {
        const data = await generateSuggestion();
        setSuggestion(data.output);
      } catch (error) {
        console.log("Error generating suggestion:", error);
        setSuggestion("Oops, unable to generate a suggestion at the moment.");
      }
    };

    getSuggestion();
  }, [uid]);

  if (
    !uid ||
    totalEvents === null ||
    completedEvents === null ||
    upcomingEvents === null ||
    overdueCount === null ||
    activities === null
  ) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={{ flex: 1 }}>
          <SideMenu testID="side-menu" open={open} setOpen={setOpen} />

          <View style={styles.mainContainer}>
            <View style={styles.titleContainer}>
              <ThemedText type="title">Hello {name}!</ThemedText>

              <View style={styles.iconContainer}>
                <TouchableOpacity
                  onPress={debouncePress(() => setModalVisible(true))}
                >
                  {activities.length != 0 ? (
                    <RingingBell testID="ringing-bell" isRinging={true} />
                  ) : (
                    <RingingBell testID="ringing-bell" isRinging={false} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={debouncePress(toggleOpen)}>
                  <ProfilePic
                    testID="profile-pic"
                    imageUrl={photoUrl}
                    size={PROFILEPICSIZE}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.subContainer}>
              <Text style={styles.header}>My Progress</Text>

              <View style={styles.progressStats}>
                <View style={styles.donutContainer}>
                  <DonutChart
                    testID="donut-chart"
                    value={completedEvents}
                    max={!totalEvents ? 1 : totalEvents}
                    radius={ms(60)}
                    strokeWidth={ms(25)}
                  />
                </View>

                <View style={styles.progressTextContainer}>
                  <AnimatedTextInput
                    testID="animated-text"
                    value={completedEvents}
                    textColor="white"
                    size={RFValue(25)}
                  />
                  <Text style={styles.progressText}>OUT OF</Text>
                  <AnimatedTextInput
                    testID="animated-text"
                    value={totalEvents}
                    textColor="white"
                    size={RFValue(25)}
                  />
                  <Text style={styles.progressText}>COMPLETED</Text>
                </View>
              </View>
            </View>

            <View style={[{ height: vs(200), paddingVertical: vs(10) }]}>
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {overdueCount && (
                  <View
                    testID="overdue-container"
                    style={styles.overdueContainer}
                  >
                    <Text style={[styles.smallText, { fontWeight: "bold" }]}>
                      You have {overdueCount} overdue goal(s).
                    </Text>
                  </View>
                )}

                <View style={styles.upcomingContainer}>
                  <Text style={styles.header}>Upcoming</Text>
                  {upcomingEvents.length === 0 ? (
                    <View>
                      <Text style={[styles.smallText, { textAlign: "center" }]}>
                        You have no scheduled goals. Set one now!
                      </Text>
                    </View>
                  ) : (
                    upcomingEvents.map((event) => (
                      <View key={event.id} style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.smallText,
                            { fontWeight: "700", textAlign: "left" },
                          ]}
                        >
                          {event.title}
                        </Text>
                        <Text style={styles.deadlineText}>
                          Due {event.deadline}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>

            <View
              testID="suggestion-container"
              style={styles.suggestionsContainer}
            >
              <Text style={{ fontSize: RFValue(13), fontWeight: "bold" }}>
                Bucket List Inspiration 🪄
              </Text>
              <ScrollView>
                <Markdown
                  style={{
                    text: {
                      fontSize: RFValue(13),
                    },
                  }}
                >
                  {suggestion}
                </Markdown>
              </ScrollView>
            </View>
          </View>
        </ThemedView>
      </ScrollView>

      <Notifications
        testID="notifications-modal"
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        items={activities}
        userId={uid}
        setActivities={setActivities}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: s(18),
    paddingTop: vs(30),
    gap: s(14),
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    flexDirection: "row",
    gap: s(20),
    alignItems: "center",
  },
  subContainer: {
    alignItems: "center",
    paddingVertical: vs(15),
    paddingHorizontal: s(12),
    backgroundColor: "#6a5acd",
    gap: vs(10),
  },
  upcomingContainer: {
    alignItems: "flex-start",
    paddingVertical: vs(15),
    paddingHorizontal: s(11),
    backgroundColor: "#6a5acd",
    gap: vs(10),
    flex: 1,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: s(25),
  },
  donutContainer: {
    alignItems: "center",
  },
  progressTextContainer: {
    alignItems: "center",
  },
  progressText: {
    lineHeight: ms(30),
    color: "white",
  },
  overdueContainer: {
    paddingHorizontal: s(10),
    backgroundColor: "crimson",
    paddingVertical: vs(6),
    alignItems: "center",
  },
  suggestionsContainer: {
    height: vs(140),
    paddingVertical: vs(13),
    paddingHorizontal: s(12),
    backgroundColor: "rgba(102, 205, 170, 1)",
    borderColor: "#6a5acd",
    borderRadius: 5,
    borderWidth: 1,
    shadowColor: "#0000cd",
    shadowOpacity: 1,
    elevation: 10,
  },
  header: {
    color: "white",
    fontSize: RFValue(20),
    fontWeight: "600",
    alignSelf: "center",
  },
  smallText: {
    fontSize: RFValue(13),
    color: "white",
  },
  deadlineText: {
    fontSize: RFValue(12),
    color: "#caffd3",
    textAlign: "left",
  },
});
