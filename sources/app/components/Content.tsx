import * as React from 'react';
import { View } from 'react-native';

export const Content = React.memo((props: { children?: any }) => {
    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ flexGrow: 1, flexBasis: 0, maxWidth: 500, flexDirection: 'column', alignItems: 'stretch' }}>
                {props.children}
            </View>
        </View>
    )
});