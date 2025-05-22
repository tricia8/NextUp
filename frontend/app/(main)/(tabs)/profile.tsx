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
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.mainContainer}>

            <View style={styles.topContainer}>
                <FontAwesome name="user-circle-o" size={ms(80)} color="#7b68ee" />

                <View style={styles.profileDetails}>
                    <View style={styles.username}>
                        <ThemedText type="subtitle">az123</ThemedText>
                        <TouchableOpacity style={styles.editButton}>
                            <ThemedText style={{fontSize: RFValue(12)}}>Edit Profile</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View>
                        <ThemedText style={{fontSize: RFValue(12), lineHeight: vs(20)}}>Live life to the fullest. You only live once. Don't leave regrets.</ThemedText>
                    </View>
                </View>  

            </View>


            <View style={styles.middleContainer}>
                <View>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>10</ThemedText>{'\n'}
                        <Text style={styles.subDataText}>GOALS{'\n'}CREATED</Text>
                    </ThemedText>
                </View>

                <View>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>5</ThemedText>{'\n'} 
                        <Text style={styles.subDataText}>GOALS{'\n'}COMPLETED</Text>
                    </ThemedText>
                </View>

                <View>
                    <ThemedText style={styles.dataText}>
                        <ThemedText type='subtitle'>Travel</ThemedText>{'\n'}
                        <Text style={styles.subDataText}>TOP{'\n'}CATEGORY</Text>
                    </ThemedText>
                </View>
            </View>

            <View style={styles.previewContainer}>
              <View style={styles.previewContainer}>
                <Preview route='bucketlist' title='Bucket List' color='rgba(94, 231, 255, 0.5)' component={<BucketList />}/>
                </View>
                <View style={styles.previewContainer}>
                <Preview route='journey' title='Journey' color='rgba(26, 230, 186, 0.5)' component={<JourneyScreen />}/>
              </View>
            </View>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  )


  function Preview(
      { route, title, color, component}: 
      { route: string, title: string, color: string, component: React.ReactNode} ) {
      
        return (
        <TouchableOpacity 
          onPress={() => router.push(`./${route}`)}
        >
            <View style={{height: '100%', width: '100%'}}>
              <View style={{ padding: 15 }}>
                <ThemedText type="subtitle" style={{textAlign: 'center'}}>{title}</ThemedText>
              </View>
              {component}
            </View>
            <LinearGradient 
              colors={['#00000000', color]} 
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none">
            </LinearGradient>
        </TouchableOpacity> 
    )}

}



const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(16),
  },
  topContainer: {
    paddingHorizontal: s(22),
    paddingTop: vs(45),
    flexDirection: 'row',
    gap: s(18),
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
    flexDirection: 'column',
    gap: vs(8),
  },
  username: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: 20,
    backgroundColor: '#7b68ee',
    alignSelf: 'flex-start'
  },
  middleContainer: {
    paddingHorizontal: s(22),
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  dataText: {
    textAlign: 'center',
    lineHeight: s(32),
  },
  subDataText: {
    fontSize: RFValue(12),
    lineHeight: s(20),
  },
  previewContainer: {
    flex: 1,
  },
});