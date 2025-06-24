import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { s, ms, vs } from "react-native-size-matters";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import DonutChart from "@/components/AnimatedDonutChart";
import AnimatedTextInput from "@/components/AnimatedTextInput";
import SideMenu from "@/components/SideMenu";
import { useCallback, useContext, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { Event } from "@/types/event";
import LoadingScreen from "@/components/Loading";
import {
  getUserStats,
  getUpcomingEvents,
  getOverdueEvents,
} from "@/firebase/firestore";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const uid = user?.uid;
  const username = user?.username;
  const [open, setOpen] = useState<boolean>(false);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [completedEvents, setCompletedEvents] = useState<number | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[] | null>(null);
  const [overdueCount, setOverdueCount] = useState<number | null>(null);

  const toggleOpen = () => {
    setOpen(!open);
  };

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      const fetchStats = async () => {
        try {
          const stats = await getUserStats(uid);
          setTotalEvents(stats.totalEvents);
          setCompletedEvents(stats.completedEvents);
        } catch (error) {
          console.error("Error fetching user stats:", error);
        }
      };

      fetchStats();
    }, [uid])
  );

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;

      const now = new Date();

      getUpcomingEvents(uid, now, setUpcomingEvents);

      getOverdueEvents(uid, now, (overdue: Event[]) => {
        setOverdueCount(overdue.length);
      });
    }, [uid])
  );

  if (
    !uid ||
    !totalEvents ||
    !completedEvents ||
    !upcomingEvents ||
    !overdueCount
  ) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={{ flex: 1 }}>
          <SideMenu open={open} setOpen={setOpen} />

          <View style={styles.mainContainer}>
            <View style={styles.titleContainer}>
              <ThemedText type="title">Hello {username}!</ThemedText>

              <View style={styles.iconContainer}>
                <TouchableOpacity>
                  <Ionicons
                    name="notifications"
                    size={ms(28)}
                    color="#66cdaa"
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleOpen}>
                  <FontAwesome
                    name="user-circle"
                    size={ms(50)}
                    color="#6a5acd"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.subContainer}>
              <Text style={styles.header}>My Progress</Text>

              <View style={styles.progressStats}>
                <View style={styles.donutContainer}>
                  <DonutChart
                    value={completedEvents}
                    max={!totalEvents ? 1 : totalEvents}
                    radius={ms(60)}
                    strokeWidth={ms(25)}
                  />
                </View>

                <View style={styles.progressTextContainer}>
                  <AnimatedTextInput
                    value={completedEvents}
                    textColor="white"
                    size={RFValue(25)}
                  />
                  <Text style={styles.progressText}>OUT OF</Text>
                  <AnimatedTextInput
                    value={totalEvents}
                    textColor="white"
                    size={RFValue(25)}
                  />
                  <Text style={styles.progressText}>COMPLETED</Text>
                </View>
              </View>
            </View>

            <View style={[{ height: vs(200) }]}>
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {overdueCount && (
                  <View style={styles.overdueContainer}>
                    <Text style={[styles.smallText, { fontWeight: "bold" }]}>
                      You have {overdueCount} overdue goals.
                    </Text>
                  </View>
                )}

                <View style={[styles.subContainer, { flex: 1 }]}>
                  <Text style={styles.header}>Upcoming</Text>
                  {upcomingEvents.length === 0 ? (
                    <View>
                      <Text style={styles.smallText}>
                        You have no scheduled goals. Set one now!
                      </Text>
                    </View>
                  ) : (
                    upcomingEvents.map((event) => (
                      <View key={event.id}>
                        <Text style={styles.smallText}>
                          {event.title} — {event.deadline}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>

            <View style={styles.quoteContainer}>
              <ScrollView>
                <ThemedText style={styles.smallText}>
                  Twenty years from now you will be more disappointed by the
                  things you didn't do than by the ones you did do. — Mark Twain
                </ThemedText>
              </ScrollView>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
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
    paddingHorizontal: s(10),
    backgroundColor: "#6a5acd",
    gap: vs(10),
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
  quoteContainer: {
    height: vs(100),
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(10),
    paddingHorizontal: s(10),
    backgroundColor: "rgba(102, 205, 170, 0.7)",
  },
  header: {
    color: "white",
    fontSize: RFValue(20),
    fontWeight: "600",
    textAlign: "center",
  },
  smallText: {
    fontSize: RFValue(13),
    color: "white",
  },
});
