import { HeadlessAppTask } from "./modules/services/BackgroundService";
import { AppRegistry } from "react-native";
AppRegistry.registerHeadlessTask('HeadlessAppTask', () => HeadlessAppTask);