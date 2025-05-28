import React from 'react';
import { Animated, TextInput, StyleSheet, View } from 'react-native';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

export default function AnimatedTextInput({
    value = 75,
    duration = 1000,
    delay = 0,
    textColor = 'white',
    size = 30,
    max = 100,
}) {
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    
    const inputRef = React.useRef<TextInput>(null);

    const animation = (toValue: number) => {
            return Animated.timing(animatedValue, {
                toValue,
                duration,
                delay,
                useNativeDriver: true
            }).start();
        };

    React.useEffect(() => {
        animation(value);
        
        animatedValue.addListener(v => {
            if (inputRef?.current) {
                inputRef.current.setNativeProps( {
                    text: `${Math.round(v.value)}`
                })
            }
        });

        return () => {
            animatedValue.removeAllListeners();
        };
    }, [max, value]);
    

    return (
        <View>
            <AnimatedInput
                ref={inputRef}
                editable={false}
                defaultValue='0'
                style={{
                    fontSize: size, 
                    color: textColor,
                    fontWeight: '900', 
                    textAlign: 'center',
                    lineHeight: 15,
                }}
            />
        </View>
    )

}