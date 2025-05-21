import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LegendList } from '@legendapp/list';
import { MaterialCommunityIcons } from '@expo/vector-icons';




export default function JourneyScreen() {

    const events = [
        { id: 0, date: '11 June 2024', title: 'Skiing with friends', description: 'First event' },
        { id: 1, date: '13 June 2024', title: 'See the northern lights with family', description: 'Second event' },
    ];

    type MileStone = {
    id: number;
    date: string;
    title: string;
    description: string;
}

    function renderItem({ item }: { item: MileStone }) {

        return (
            <View style={{
                alignItems: item.id % 2 === 0 ? 'flex-start' : 'flex-end',
            }}>
                <TouchableOpacity style={styles.itemContainer}>
                    <MaterialCommunityIcons name="flag-variant" size={ms(30)} color="#66cdaa" />
                    <ThemedText style={styles.itemText}>{item.title}</ThemedText>
                </TouchableOpacity>
            </View>
        )
    }
    

    return (
        <SafeAreaView edges={[]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <ThemedView style={styles.mainContainer}>
                    <LegendList
                        data={events}
                        renderItem={renderItem}
                        keyExtractor={(item: MileStone) => item.id.toString()}
                        recycleItems={true}
                        maintainVisibleContentPosition
                    />
                </ThemedView>
            </ScrollView>
        </SafeAreaView>        
    )
}


const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingHorizontal: s(15),
        paddingTop: vs(20),
    },
    itemContainer: {
        maxWidth: s(150),
        flexDirection: 'row',
    },
    itemText: {
        fontSize: RFValue(14),
        flexShrink: 1, 
        flexWrap: 'wrap',
    },
});