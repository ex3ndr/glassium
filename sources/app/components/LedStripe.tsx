import * as React from 'react';
import { Text, View } from 'react-native';

export const LedStripe = React.memo((props: { text: string }) => {
    return (
        <View style={{ backgroundColor: '#4E171C', borderRadius: 8, height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 16, marginVertical: 8 }}>
            <Text
                style={{
                    color: '#FBFFA0',
                    shadowColor: '#FC0C1A',
                    shadowRadius: 5,
                    shadowOpacity: 1,
                    shadowOffset: { width: 0, height: 0 },
                    fontSize: 24,
                    fontWeight: '800',
                }}
                ellipsizeMode="head"
                numberOfLines={1}
            >
                {props.text}
            </Text>
        </View>
    )
});