import { AppRegistry, Platform } from "react-native";
import { HeadlessAppTask } from "./modules/services/BackgroundService";
if (Platform.OS === 'android') {
    AppRegistry.registerHeadlessTask('HeadlessAppTask', () => HeadlessAppTask);
}