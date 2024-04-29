import { HeadlessAppTask } from "./modules/state/BackgroundService";
import { AppRegistry } from "react-native";
AppRegistry.registerHeadlessTask('HeadlessAppTask', () => HeadlessAppTask);