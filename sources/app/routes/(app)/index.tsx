import { Text, View } from 'react-native';
import { Theme } from '../../../theme';
import { storage } from '@/storage';

export default function Page() {
    return (
        <View style={{ paddingTop: 48 }}>
            <Text style={{ color: Theme.text }}>Home page</Text>
        </View>
    );
}