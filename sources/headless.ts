import { HeadlessAppTask } from "./modules/services/BackgroundService";
import { AppRegistry, Platform } from "react-native";
if (Platform.OS === 'android') {
    AppRegistry.registerHeadlessTask('HeadlessAppTask', () => HeadlessAppTask);
}