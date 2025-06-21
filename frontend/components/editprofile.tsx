import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Modal from "react-native-modal";
import { User } from '@/types/user';
import { updateProfile } from '@/firebase/firestore';
import CategoryPicker from './forms/CategoryPicker';


type editProfileProps = {
    visible: boolean,
    onClose: () => void,
    userData: User,
}

export default function EditProfile({ visible, onClose, userData }: editProfileProps) {
  
  const [bioText, setBioText] = useState(userData.bio);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string[]>([]);
  const colorScheme = useColorScheme();
  const styles = makeStyles(colorScheme);

  const handleSave = async (uid: string, profileDetails: Partial<User>) => {
    try {
        await updateProfile(uid, profileDetails);
        Alert.alert("Saved!");
        onClose();
    } catch (error) {
        Alert.alert("Error saving");
    }
  }

  return (
      <Modal
          isVisible={visible}
          backdropOpacity={0.4}
          onBackdropPress={onClose}
          animationIn="zoomIn"
          animationOut="zoomOut"
          useNativeDriver
      >
            <View style={{justifyContent: 'center'}}>
                <ThemedView style={styles.mainContainer}>
                    <View style={styles.profileContainer}>
                        <FontAwesome name="user-circle-o" size={ms(100)} color="#7b68ee" />

                        <ThemedText type='defaultSemiBold'>{userData.username}</ThemedText>  

                        <View style={styles.bioContainer}>
                            <ThemedText>Bio:</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder='Add your bio'
                                placeholderTextColor='gray'
                                selectionColor='gray'
                                multiline
                                value={bioText}
                                onChangeText={(text) => setBioText(text)}
                            />
                        </View>

                        <CategoryPicker
                          open={categoryOpen}
                          setOpen={setCategoryOpen}
                          onOpen={() => {}}
                          selectedTags={selectedTag}
                          setSelectedTags={setSelectedTag}
                          max={1}
                        />

                        <TouchableOpacity 
                          style={styles.button} 
                          onPress={() => handleSave(userData.uid, {bio: bioText, category: selectedTag})}>
                            <Text style={styles.buttonText}>SAVE</Text>
                        </TouchableOpacity>
                    </View>
                
                </ThemedView>
            </View>
      </Modal>
  )
}




const makeStyles = (colorScheme: any) => StyleSheet.create({
  mainContainer: {
    paddingHorizontal: s(15),
    paddingVertical: vs(15),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7b68ee',
  },
  profileContainer: {
    alignItems: 'center',
    gap: vs(14),
  },
  bioContainer: {
    backgroundColor: 'transparent',
    borderColor: '#7b68ee',
    flexDirection: 'row',
    gap: s(8),
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: vs(35),
    borderColor: '#7b68ee',
    borderWidth: 1,
    paddingHorizontal: s(10),
    borderRadius: 10,
    color: colorScheme === 'dark' ? 'white' : 'black',
    backgroundColor: 'transparent',
  },
  button: {
    paddingHorizontal: s(15),
    paddingVertical: vs(5),
    borderRadius: 10,
    backgroundColor: '#66cdaa',
  },
  buttonText: {
    fontSize: RFValue(12),
    color: 'black',
  },
});