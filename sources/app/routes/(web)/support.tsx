import { Text, View } from "react-native";
import { Theme } from "../../theme";

export default function Support() {
    return (
        <View style={{ margin: 64, flexDirection: 'column' }}>
            <Text style={{ color: Theme.text, fontWeight: '600', fontSize: 24 }}>Support</Text>
            <Text style={{ color: Theme.text, fontSize: 18, marginTop: 16 }}>
                At the moment support is available only via email: support@bulkovo.com
            </Text>
        </View>
    )
}