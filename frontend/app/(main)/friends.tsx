import React, { use } from 'react';
import { StyleSheet, ScrollView, View, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { ThemedView } from '@/components/ThemedView';
import { useState } from 'react'


export default function JourneyScreen() {
    const [search, setSearch] = useState('');

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
                        onChangeText={setSearch}
                    />
                </View>
            </ThemedView>
        </ScrollView>
    </SafeAreaView>
)}





const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    gap: vs(16),
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
    color: useColorScheme() === 'dark' ? 'white' : 'black',
    backgroundColor: 'transparent',
  },
})