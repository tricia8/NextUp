import React from 'react';
import { StyleSheet, ScrollView, View, Text,TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import BucketList from './bucketlist';
import JourneyScreen from './journey';


export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.mainContainer}>

            <View style={styles.topContainer}>
                <FontAwesome name="user-circle-o" size={ms(80)} color="purple" />

                <View style={styles.profileDetails}>
                    <View style={styles.username}>
                        <ThemedText type="subtitle">az123</ThemedText>
                        <TouchableOpacity style={styles.editButton}>
                            <ThemedText style={{fontSize: RFValue(13)}}>Edit Profile</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View>
                        <ThemedText style={{fontSize: RFValue(12), lineHeight: vs(20)}}>Live life to the fullest. You only live once. Don't leave regrets.</ThemedText>
                    </View>
                </View>  

            </View>


            <View style={styles.middleContainer}>
                <View style={styles.dataContainer}>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>10</ThemedText>{'\n'}
                        <Text style={styles.subDataText}>GOALS{'\n'}CREATED</Text>
                    </ThemedText>
                </View>

                <View style={styles.dataContainer}>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>5</ThemedText>{'\n'} 
                        <Text style={styles.subDataText}>GOALS{'\n'}COMPLETED</Text>
                    </ThemedText>
                </View>

                <View style={styles.dataContainer}>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>Travel</ThemedText>{'\n'}
                        <Text style={styles.subDataText}>TOP{'\n'}CATEGORY</Text>
                    </ThemedText>
                </View>
            </View>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  )

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(10),
  },
  topContainer: {
    paddingHorizontal: s(22),
    paddingTop: vs(40),
    flexDirection: 'row',
    gap: s(18),
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
    flexDirection: 'column',
    gap: vs(6),
  },
  username: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: 20,
    backgroundColor: 'purple',
    alignSelf: 'flex-start'
  },
  middleContainer: {
    paddingHorizontal: s(22),
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  dataContainer: {
  },
  dataText: {
    textAlign: 'center',
    lineHeight: s(32),
  },
  subDataText: {
    fontSize: RFValue(12),
    lineHeight: s(20),
  },
  bottomContainer: {

  },
});