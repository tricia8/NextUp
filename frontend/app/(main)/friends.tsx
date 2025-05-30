import React from 'react';
import { StyleSheet, ScrollView, View, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LegendList } from '@legendapp/list';



const friends = [
        { id: 0, username: 'bp099' },
        { id: 1, username: 'ef32' },
    ];

export default function FriendsScreen() {
    const [search, setSearch] = React.useState('');
    const [filteredFriends, setFriends] = React.useState(friends);
    const colorScheme = useColorScheme();
    const styles = makeStyles(colorScheme);


    type Friend = {
      id: number,
      username: string,
    }

    


    const filterData = (text: string) => {
      const formattedQuery = text.toLowerCase();
      const filtered = friends.filter((item: Friend) => {
        return item.username.toLowerCase().includes(formattedQuery);
      });
      setFriends(filtered);
      setSearch(text);
    };


    function renderItem({item}: {item: Friend}) {
          return (
              <TouchableOpacity style={styles.friendsContainer}>
                  <ThemedText style={{fontSize: RFValue(14)}}>{item.username}</ThemedText>
              </TouchableOpacity>
          )
      }



    return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <ThemedView style={styles.mainContainer}>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder='Search friends'
                        placeholderTextColor='gray'
                        selectionColor='gray'
                        value={search}
                        onChangeText={(text) => filterData(text)}
                    />
                </View>

                <LegendList
                    data={filteredFriends}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    recycleItems={true}
                    maintainVisibleContentPosition            
                />
            </ThemedView>
        </ScrollView>
    </SafeAreaView>
)}





const makeStyles = (colorScheme: any) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(14),
  },
  searchContainer: {
    paddingHorizontal: s(15),
    paddingVertical: vs(15),
    backgroundColor: 'transparent',
    borderColor: '#7b68ee',
    borderBottomWidth: 1,
  },
  input: {
    height: vs(35),
    borderColor: '#7b68ee',
    borderWidth: 1,
    paddingHorizontal: s(10),
    borderRadius: 10,
    color: colorScheme === 'dark' ? 'white' : 'black',
    backgroundColor: 'transparent',
  },
  friendsContainer: {
    paddingHorizontal: s(20),
    paddingVertical: vs(4),
  },
})