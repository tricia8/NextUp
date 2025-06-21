import { ActivityIndicator, SafeAreaView } from "react-native";

export default function LoadingScreen() {
    return (
        <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size='large' color='#66cdaa'/>
        </SafeAreaView>
    )
}