import React from 'react';
import { Alert, StyleSheet, View, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { ThemedText } from '@/components/ThemedText';
import { LegendList } from '@legendapp/list';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { User } from '@/types/user';
import { router } from 'expo-router';
import { addFriend } from '@/firebase/firestore';





type Props = {
  users: User[];
  showAddButton?: boolean;
  placeholder?: string;
  userId: string;
};

export default function UserSearch({users, showAddButton = false, placeholder = '', userId}: Props) {
    const [search, setSearch] = React.useState('');
    const [filteredUsers, setUsers] = React.useState(users);
    const colorScheme = useColorScheme();
    const styles = makeStyles(colorScheme);

    const filterData = (text: string) => {
      const formattedQuery = text.toLowerCase();
      const filtered = users.filter((item) => {
        return item.username.toLowerCase().includes(formattedQuery);
      });
      setUsers(filtered);
      setSearch(text);
    };


    const handleAddFriend = async (userId: string, friendId: string) => {
        try {
            await addFriend(userId, friendId);
            Alert.alert('Success', 'Friend added!');
        } catch (error) {
            console.log('Error adding friend');
            Alert.alert('Error', 'Error adding friend.');
        }
    }

    function renderItem({item}: {item: User}) {
          return (
            <TouchableOpacity style={styles.userRowContainer} 
              onPress={() => router.push({
                pathname: "/profile",
                params: { uid: item.uid },
            })}>
              <View style={styles.userDisplay}>
                  <FontAwesome name="user-circle-o" size={ms(40)} color="#7b68ee" />
                  <ThemedText style={{fontSize: RFValue(14)}}>{item.username}</ThemedText>
                  {showAddButton && (
                    <TouchableOpacity onPress={() => handleAddFriend(userId, item.uid)}>
                        <MaterialIcons name='group-add' color='white' size={ms(18)}/>
                    </TouchableOpacity>
                  )}
              </View>
            </TouchableOpacity>
          )
      }



    return (
        <View>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor='gray'
                    selectionColor='gray'
                    value={search}
                    onChangeText={(text) => filterData(text)}
                />
            </View>

            <LegendList
                data={filteredUsers}
                renderItem={renderItem}
                keyExtractor={(item) => item.uid}
                recycleItems={true}
                maintainVisibleContentPosition            
            />
        </View>
)}





const makeStyles = (colorScheme: any) => StyleSheet.create({
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
  userRowContainer: {
    justifyContent: 'space-between',
  },
  userDisplay: {
    paddingHorizontal: s(20),
    paddingVertical: vs(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
})