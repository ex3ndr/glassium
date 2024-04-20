import { Linking } from "react-native";

export async function openSystemSettings() {
    await Linking.openURL('app-settings:');
}