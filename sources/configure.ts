import Bugsnag from '@bugsnag/expo';
if (!__DEV__) {
    Bugsnag.start();
}

import { LogBox } from "react-native";
LogBox.ignoreAllLogs();