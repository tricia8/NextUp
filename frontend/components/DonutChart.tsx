import React from 'react';
import { Animated, View, Text, TextInput, StyleSheet } from 'react-native';
import Svg, {G, Circle} from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedInput = Animated.createAnimatedComponent(TextInput);


export default function DonutChart({
    value = 75,
    radius = 40,
    strokeWidth = 20,
    duration = 500,
    delay = 0,
    color = 'grey',
    textColor = 'black',
    max = 100,
}) {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    const circleRef = React.useRef<Circle>(null);
    const inputRef = React.useRef<TextInput>(null);

    const halfCircle = radius + strokeWidth;
    const circleCircumference = 2 * Math.PI * radius;

    const animation = (toValue: number) => {
        return Animated.timing(animatedValue, {
            toValue,
            duration,
            delay,
            useNativeDriver: true
        }).start(() => {
            animation(toValue === 0 ? value : 0);
        });
    };


    React.useEffect(() => {
        animation(value);
        
        animatedValue.addListener(v => {
            if (circleRef?.current) {
                const maxPercentage = 100 * v.value / max;
                const strokeDashoffset = circleCircumference - (circleCircumference * maxPercentage) / 100;
                circleRef.current.setNativeProps({
                    strokeDashoffset,
                })
            }

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
            <Svg viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}>
                <G rotation='-90' origin={`${halfCircle}, ${halfCircle}`}>
                    <Circle
                        cx='50%'
                        cy='50%'
                        stroke={color}
                        strokeWidth={strokeWidth}
                        r={radius}
                        fill="transparent"
                        strokeOpacity={0.2}
                    />
                    <AnimatedCircle 
                        ref={circleRef}
                        cx='50%'
                        cy='50%'
                        stroke={color}
                        strokeWidth={strokeWidth}
                        r={radius}
                        fill="transparent"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={circleCircumference}
                        strokeLinecap='round'
                    />
                </G>
            </Svg>

            <AnimatedInput
                ref={inputRef}
                editable={false}
                defaultValue='0'
                style={[
                    StyleSheet.absoluteFillObject,
                    { fontSize: radius / 2, color: textColor ?? color },
                    { fontWeight: '900', textAlign: 'center' },
                ]}
            />
        </View>
    )
}
