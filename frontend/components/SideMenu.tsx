import { StyleSheet, View, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { s, ms, vs } from 'react-native-size-matters';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MenuDrawer from 'react-native-side-drawer';
import { useContext } from 'react';
import { AuthContext } from "@/context/AuthContext";
import { router } from 'expo-router';




export default function SideMenu(
    {open, setOpen}: {open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>}
) {

    const { logout } = useContext(AuthContext);

    const logOut = () => {
        logout();
        router.replace('/(auth)/login');
    }

    const drawerContent = () => {
        return (
            <ThemedView style={styles.sidebarContainer}>
                <FontAwesome name="user-circle" size={ms(50)} color="#6a5acd" />

                <TouchableOpacity style={styles.textContainer} onPress={logOut}>
                    <ThemedText style={styles.sidebarText}>Log out</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        )
    }


    return (
        <View style={StyleSheet.absoluteFill}>
            {open && 
                <TouchableWithoutFeedback onPress={() => setOpen(false)}>
                    <View style={styles.overlay}/>
                </TouchableWithoutFeedback>
            } 
            
            <View style={{zIndex: 999}}>
                <MenuDrawer
                    open={open}
                    position={'right'}
                    drawerContent={drawerContent()}
                    drawerPercentage={45}
                    animationTime={250}
                    overlay={true}
                    opacity={0.4}
                />
            </View>
        </View>
    )
}
  


const styles = StyleSheet.create({
    sidebarContainer: {
        paddingVertical: vs(30),
        alignItems:'center',
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(122, 121, 121, 0.4)',
        zIndex: 998
    },
    textContainer: {
        paddingHorizontal: s(15),
        paddingVertical: vs(15),
        width: '100%',
    },
    sidebarText: {
        fontSize: RFValue(14),
        textAlign: 'center'
    },
})