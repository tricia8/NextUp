import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Modal from "react-native-modal";
import { User } from '@/types/user';
import { updateProfile } from '@/firebase/firestore';


type editProfileProps = {
    visible: boolean,
    onClose: () => void,
    userData: User,
}

export default function EditProfile({ visible, onClose, userData }: editProfileProps) {

  const [bioText, setBioText] = useState(userData.bio);
  const colorScheme = useColorScheme();
  const styles = makeStyles(colorScheme);

  const handleSave = async (uid: string, profileDetails: Partial<User>) => {
    try {
        await updateProfile(uid, profileDetails);
        Alert.alert("Saved!");
    } catch (error) {
        Alert.alert("Error saving");
    }
  }

  return (
            <Modal
                isVisible={visible}
                onBackdropPress={onClose}
                backdropOpacity={0.4}
                animationIn="zoomIn"
                animationOut="zoomOut"
                useNativeDriver
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{flex: 1, justifyContent: 'center'}}>
                        <ThemedView style={styles.mainContainer}>
                            <View style={styles.profileContainer}>
                                <FontAwesome name="user-circle-o" size={ms(100)} color="#7b68ee" />

                                <ThemedText type='defaultSemiBold'>{userData.username}</ThemedText>  

                                <View style={styles.bioContainer}>
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

                                <TouchableOpacity style={styles.button} onPress={() => handleSave(userData.uid, {bio: bioText})}>
                                    <Text style={styles.buttonText}>SAVE</Text>
                                </TouchableOpacity>
                            </View>
                        
                        </ThemedView>
                    </View>
                    
                </ScrollView>

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